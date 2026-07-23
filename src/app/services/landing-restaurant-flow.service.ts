import { Injectable } from '@angular/core';
import { Branch, Restaurant } from '../types/domain';
import { LandingDataService } from './landing-data.service';
import { LandingSelectionService } from './landing-selection.service';
import { LandingCartService } from './landing-cart.service';
import { LandingCheckoutFormService } from './landing-checkout-form.service';
import { LandingUiStateService } from './landing-ui-state.service';
import { getDisplayedBranches } from '../utils/branch-utils';
import { LandingLocationService } from './landing-location.service';
import { GeolocationService } from './geolocation.service';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class LandingRestaurantFlowService {
  constructor(
    private landingDataService: LandingDataService,
    private selectionService: LandingSelectionService,
    private cartService: LandingCartService,
    private checkoutFormService: LandingCheckoutFormService,
    private uiStateService: LandingUiStateService,
    private locationService: LandingLocationService,
    private geo: GeolocationService,
    private apiService: ApiService
  ) {}

  normalizeBranches(branches: Branch[], restaurantName?: string): Branch[] {
    return this.landingDataService.normalizeBranches(branches, restaurantName);
  }

  setRestaurants(restaurants: Restaurant[]) {
    return {
      restaurants,
      branches: this.landingDataService.normalizeRestaurants(restaurants)
    };
  }

  initializeSelection(restaurant: Restaurant | null, branches: Branch[] = []) {
    const normalizedBranches = this.normalizeBranches(branches, restaurant?.name);

    this.selectionService.setRestaurantSelection(restaurant, normalizedBranches);
    this.selectionService.setBranchLists(normalizedBranches, getDisplayedBranches(normalizedBranches, this.selectionService.branchSearchTerm()));
    this.cartService.resetCheckout();
    this.checkoutFormService.reset();

    return normalizedBranches;
  }

  beginBranchSelection(branches: Branch[]) {
    this.selectionService.setBranchLists(branches, getDisplayedBranches(branches, this.selectionService.branchSearchTerm()));
  }

  finishSelection(restaurant: Restaurant | null, branches: Branch[] = []) {
    const normalizedBranches = this.initializeSelection(restaurant, branches);
    const branchList = restaurant?.branches || [];

    if (branchList.length === 1) {
      const singleBranch = branchList[0];
      this.selectionService.selectBranch(singleBranch);
      return { normalizedBranches, selectedBranch: singleBranch };
    }

    this.selectionService.selectBranch(null);
    return { normalizedBranches, selectedBranch: null };
  }

  async selectRestaurant(restaurant: Restaurant | null, branches: Branch[] = []) {
    const { normalizedBranches, selectedBranch } = this.finishSelection(restaurant, branches);
    await this.calculateDistancesToBranches(restaurant?.branches || [], restaurant?.name);
    return { normalizedBranches, selectedBranch };
  }

  async findNearestBranch(restaurant: Restaurant | null, branchSearchTerm: string, sourceBranches?: Branch[]) {
    if (!restaurant || this.uiStateService.loading()) {
      return null;
    }

    this.uiStateService.setLoading(true);
    this.cartService.setError(null);
    this.selectionService.detectedAddress.set(null);

    const branchesToEvaluate = sourceBranches ?? this.selectionService.branchSource().length > 0
      ? this.selectionService.branchSource()
      : this.normalizeBranches(restaurant.branches || [], restaurant.name);
    this.selectionService.setBranchLists(branchesToEvaluate, getDisplayedBranches(branchesToEvaluate, branchSearchTerm));

    try {
      const pos = await this.geo.getCurrentPosition();
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      const detectedAddress = await this.reverseGeocodeAndPopulateForm(userLat, userLng);
      this.selectionService.detectedAddress.set(detectedAddress);

      const { distancesMap, branchesWithDistance } = this.locationService.calculateBranchDistances(branchesToEvaluate, userLat, userLng);
      const filteredBranches = branchesWithDistance.filter((branch) => branch.distance !== null);

      this.selectionService.setBranchDistances(distancesMap);
      const sortedBranches = getDisplayedBranches(filteredBranches, branchSearchTerm);
      this.selectionService.setBranchLists(branchesWithDistance, sortedBranches);

      const nearest = sortedBranches.length > 0 ? sortedBranches[0] : null;
      this.uiStateService.setLoading(false);

      if (nearest) {
        this.selectionService.suggestedNearestBranch.set(nearest);
        return null;
      }

      return 'LANDING.ERRORS.BRANCH_LOCATION_UNAVAILABLE';
    } catch (err: unknown) {
      this.uiStateService.setLoading(false);
      return this.locationService.getLocationErrorMessage(err, 'LANDING.ERRORS.LOCATION_UNAVAILABLE_BRANCH', 'LANDING.ERRORS.LOCATION_PERMISSION_BRANCH');
    }
  }

  async findNearestRestaurant(lat: number, lng: number) {
    if (this.uiStateService.loading()) {
      return { restaurants: [], branches: [], errorMessage: null };
    }

    this.uiStateService.setLoading(true);
    this.cartService.setError(null);

    return new Promise<{ restaurants: Restaurant[]; branches: Branch[]; errorMessage: string | null }>((resolve) => {
      this.apiService.getNearestRestaurants(lat, lng).subscribe({
        next: (restaurants) => {
          const branches = this.landingDataService.normalizeRestaurants(restaurants);
          this.selectionService.setRestaurantSelection(restaurants[0] ?? null, branches);
          this.selectionService.setBranchLists(branches, getDisplayedBranches(branches, this.selectionService.branchSearchTerm()));
          this.uiStateService.setLoading(false);

          resolve({
            restaurants,
            branches,
            errorMessage: restaurants.length > 0 ? null : 'LANDING.ERRORS.NEARBY_RESTAURANT_UNAVAILABLE'
          });
        },
        error: () => {
          this.uiStateService.setLoading(false);
          resolve({ restaurants: [], branches: [], errorMessage: 'LANDING.ERRORS.NEARBY_RESTAURANT_FAILED' });
        }
      });
    });
  }

  async calculateDistancesToBranches(branches: Branch[], restaurantName?: string) {
    const normalizedBranches = this.normalizeBranches(branches, restaurantName);
    this.selectionService.setBranchLists(normalizedBranches, getDisplayedBranches(normalizedBranches, this.selectionService.branchSearchTerm()));

    try {
      const pos = await this.geo.getCurrentPosition();
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      const { distancesMap, branchesWithDistance } = this.locationService.calculateBranchDistances(normalizedBranches, userLat, userLng);
      this.selectionService.setBranchDistances(distancesMap);
      this.selectionService.setBranchLists(branchesWithDistance, getDisplayedBranches(branchesWithDistance, this.selectionService.branchSearchTerm()));
    } catch {
      this.selectionService.setBranchDistances(new Map());
      this.selectionService.setBranchLists(normalizedBranches, getDisplayedBranches(normalizedBranches, this.selectionService.branchSearchTerm()));
    }
  }

  setBranchSearch(searchTerm: string, sourceBranches: Branch[] = []) {
    this.selectionService.branchSearchTerm.set(searchTerm);
    this.selectionService.setBranchLists(sourceBranches, getDisplayedBranches(sourceBranches, searchTerm));
  }

  async reverseGeocodeAndPopulateForm(lat: number, lng: number) {
    const formatted = await this.locationService.reverseGeocodeLocation(lat, lng);
    if (formatted) {
      const parts = formatted.split(',');
      const street = parts[0]?.trim() ?? '';
      const city = parts[parts.length - 1]?.trim() ?? '';
      this.checkoutFormService.street.set(street);
      this.checkoutFormService.houseNumber.set('');
      this.checkoutFormService.city.set(city);
    }
    return formatted;
  }

  resetFlowState() {
    this.selectionService.resetSelectionState();
    this.uiStateService.setLoading(false);
    this.uiStateService.setMenuLoading(false);
  }
}
