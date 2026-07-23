import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GeolocationService } from '../services/geolocation.service';
import { LandingOrderService } from '../services/landing-order.service';
import { LandingCartService } from '../services/landing-cart.service';
import { LandingSelectionService } from '../services/landing-selection.service';
import { LandingCheckoutFormService } from '../services/landing-checkout-form.service';
import { LandingMenuStateService } from '../services/landing-menu-state.service';
import { LandingViewModelService } from '../services/landing-view-model.service';
import { LandingUiStateService } from '../services/landing-ui-state.service';
import { LandingRestaurantFlowService } from '../services/landing-restaurant-flow.service';
import { LandingLocationService } from '../services/landing-location.service';
import { LandingDataFlowService } from '../services/landing-data-flow.service';
import { LandingCartFlowService } from '../services/landing-cart-flow.service';
import { Branch, Restaurant } from '../types/domain';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, TranslateModule, MatProgressSpinnerModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  private readonly translate = inject(TranslateService);

  restaurants = signal<Restaurant[]>([]);
  branches = signal<Branch[]>([]);
  get selectedBranch() { return this.selectionService.selectedBranch; }
  get selectedRestaurant() { return this.selectionService.selectedRestaurant; }
  get categories() { return this.selectionService.categories; }
  get menuItems() { return this.menuStateService.menuItems; }
  get selectedCategory() { return this.selectionService.selectedCategory; }
  get cart() { return this.cartService.cart; }
  get error() { return this.cartService.error; }
  get loading() { return this.uiStateService.loading; }
  readonly itemMessage = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  readonly invalidModifierGroupIds = signal<Record<string, string[]>>({});
  private itemMessageTimeout: number | null = null;
  private itemMessageHovered = false;
  get menuLoading() { return this.uiStateService.menuLoading; }
  get cartOpen() { return this.cartService.cartOpen; }
  get checkoutStep() { return this.cartService.checkoutStep; }
  get orderType() { return this.checkoutFormService.orderType; }
  get paymentMethod() { return this.checkoutFormService.paymentMethod; }
  get customerName() { return this.checkoutFormService.customerName; }
  get customerPhone() { return this.checkoutFormService.customerPhone; }
  get customerEmail() { return this.checkoutFormService.customerEmail; }
  get street() { return this.checkoutFormService.street; }
  get houseNumber() { return this.checkoutFormService.houseNumber; }
  get apartment() { return this.checkoutFormService.apartment; }
  get floor() { return this.checkoutFormService.floor; }
  get city() { return this.checkoutFormService.city; }
  get deliveryNotes() { return this.checkoutFormService.deliveryNotes; }
  get orderNotes() { return this.checkoutFormService.orderNotes; }
  get orderSubmitting() { return this.cartService.orderSubmitting; }
  get submittedOrder() { return this.cartService.submittedOrder; }
  get selectorCollapsed() { return this.selectionService.selectorCollapsed; }
  get suggestedNearestBranch() { return this.selectionService.suggestedNearestBranch; }
  get restaurantBranches() { return this.selectionService.restaurantBranches; }
  get branchSource() { return this.selectionService.branchSource; }
  get branchDistances() { return this.selectionService.branchDistances; }
  get detectedAddress() { return this.selectionService.detectedAddress; }
  get branchSearchTerm() { return this.selectionService.branchSearchTerm; }

  constructor(
    private geo: GeolocationService,
    private landingOrderService: LandingOrderService,
    private cartService: LandingCartService,
    private selectionService: LandingSelectionService,
    private checkoutFormService: LandingCheckoutFormService,
    private menuStateService: LandingMenuStateService,
    private viewModelService: LandingViewModelService,
    private uiStateService: LandingUiStateService,
    private restaurantFlowService: LandingRestaurantFlowService,
    private locationService: LandingLocationService,
    private dataFlowService: LandingDataFlowService,
    private cartFlowService: LandingCartFlowService
  ) {}

  ngOnInit(): void {
    this.loadRestaurants();
  }

  private t(key: string, params?: Record<string, unknown>) {
    return this.translate.instant(key, params);
  }

  get cartTotal(): number {
    return this.cartService.cartTotal;
  }

  get filteredMenuItems() {
    return this.viewModelService.getFilteredMenuItems(this.selectedCategory(), this.categories(), this.menuItems());
  }

  isSingleRestaurantMode(): boolean {
    return this.selectionService.isSingleRestaurantMode();
  }

  shouldShowHero(): boolean {
    return !this.selectedBranch() && (this.isSingleRestaurantMode() || !this.selectedRestaurant());
  }

  shouldShowRestaurantSelector(): boolean {
    return !this.isSingleRestaurantMode() && !this.selectedBranch() && !this.selectedRestaurant();
  }

  shouldShowBranchSelector(): boolean {
    return !!this.selectedRestaurant() && !this.selectedBranch();
  }

  shouldShowCompactRestaurantHeader(): boolean {
    return !!this.selectedRestaurant() && !this.selectorCollapsed() && !this.isSingleRestaurantMode();
  }

  loadRestaurants() {
    this.dataFlowService.loadRestaurants(
      (restaurants) => {
        this.restaurants.set(restaurants);
        const { branches } = this.restaurantFlowService.setRestaurants(restaurants);
        this.branches.set(branches);

        if (restaurants.length === 1) {
          this.selectionService.setSingleRestaurantMode(true);
          this.selectionService.setRestaurantSelection(restaurants[0], branches);
          this.selectionService.setBranchLists(branches, branches);
          this.selectionService.selectBranch(null);
          this.selectionService.selectorCollapsed.set(false);
        } else {
          this.selectionService.setSingleRestaurantMode(false);
          this.selectionService.setRestaurantSelection(null, []);
          this.selectionService.setBranchLists([], []);
          this.selectionService.selectBranch(null);
          this.selectionService.selectorCollapsed.set(false);
        }
      },
      (message) => this.cartService.setError(this.t(message))
    );
  }

  async findNearestBranch() {
    const restaurant = this.selectedRestaurant();
    if (!restaurant || this.loading()) {
      return;
    }

    const messageKey = await this.restaurantFlowService.findNearestBranch(restaurant, this.branchSearchTerm());
    if (messageKey) {
      this.cartService.setError(this.t(messageKey));
    }
  }

  async findNearestRestaurant() {
    if (this.loading()) {
      return;
    }

    try {
      const pos = await this.geo.getCurrentPosition();
      const { restaurants, branches, errorMessage } = await this.restaurantFlowService.findNearestRestaurant(pos.coords.latitude, pos.coords.longitude);
      this.restaurants.set(restaurants);
      this.branches.set(branches);

      if (restaurants.length === 1) {
        this.selectionService.setSingleRestaurantMode(true);
        this.selectionService.setRestaurantSelection(restaurants[0], branches);
        this.selectionService.setBranchLists(branches, branches);
        this.selectionService.selectBranch(null);
        this.selectionService.selectorCollapsed.set(false);
      } else {
        this.selectionService.setSingleRestaurantMode(false);
        this.selectionService.setRestaurantSelection(null, branches);
        this.selectionService.setBranchLists(branches, branches);
        this.selectionService.selectBranch(null);
        this.selectionService.selectorCollapsed.set(false);
      }

      if (errorMessage) {
        this.cartService.setError(this.t(errorMessage));
      }
    } catch (err: unknown) {
      this.uiStateService.setLoading(false);
      const messageKey = this.locationService.getLocationErrorMessage(err, 'LANDING.ERRORS.LOCATION_UNAVAILABLE_BRANCH', 'LANDING.ERRORS.LOCATION_PERMISSION_RESTAURANT');
      this.cartService.setError(this.t(messageKey));
    }
  }

  private normalizeBranches(branches: any[], restaurantName?: string): any[] {
    return this.restaurantFlowService.normalizeBranches(branches, restaurantName);
  }

  async selectRestaurant(restaurant: any) {
    this.selectionService.setSingleRestaurantMode(false);

    const { selectedBranch } = await this.restaurantFlowService.selectRestaurant(restaurant, restaurant.branches || []);

    if (selectedBranch) {
      this.loadMenu(selectedBranch.id);
    }
  }

  onBranchSearchChange(searchTerm: string) {
    this.restaurantFlowService.setBranchSearch(searchTerm, this.branchSource());
  }

  getDistanceDisplay(branchId?: string | number): string {
    if (branchId === undefined || branchId === null) {
      return '';
    }

    const distanceKm = this.selectionService.branchDistances().get(String(branchId));
    if (distanceKm === undefined || distanceKm === null) {
      return '';
    }
    if (distanceKm < 1) {
      return this.t('LANDING.DISTANCE.METERS', { value: Math.round(distanceKm * 1000) });
    }
    return this.t('LANDING.DISTANCE.KILOMETERS', { value: distanceKm.toFixed(1) });
  }

  private async reverseGeocodeLocation(lat: number, lng: number): Promise<string | null> {
    return this.restaurantFlowService.reverseGeocodeAndPopulateForm(lat, lng);
  }

  selectBranch(branch: any) {
    this.selectionService.selectBranch(branch);
    this.loadMenu(branch.id);
  }

  loadMenu(branchId: number | string) {
    this.dataFlowService.loadMenu(
      branchId,
      (categories, items) => {
        (window as any).__menuDebug = {
          categories,
          firstItem: items.find((item: any) => item.name === 'DELTA ROLLO')
        };
      },
      (message) => this.cartService.setError(this.t(message))
    );
  }

  chooseCategory(categoryName: string) {
    this.selectionService.chooseCategory(categoryName);
  }

  getSelectedSize(item: any) {
    return this.viewModelService.getSelectedSize(item);
  }

  getActiveModifierGroups(item: any) {
    return this.viewModelService.getActiveModifierGroups(item);
  }

  isModifierSelected(item: any, group: any, option: any) {
    return this.menuStateService.isModifierSelected(item, group, option);
  }

  toggleModifier(item: any, group: any, option: any) {
    this.cartFlowService.toggleModifier(item, group, option);

    const missingGroups = this.getMissingRequiredModifierGroupIds(item);
    if (missingGroups.length === 0) {
      this.clearInvalidModifierGroups(item);
    } else {
      this.invalidModifierGroupIds.update((current) => ({
        ...current,
        [String(item.id)]: missingGroups
      }));
    }
  }

  getItemDisplayPrice(item: any): number {
    return this.landingOrderService.getItemDisplayPrice(item);
  }

  selectItemSize(item: any, sizeId: string) {
    this.menuStateService.selectSize(item.id, sizeId);
  }

  addToCart(item: any) {
    const result = this.cartFlowService.addToCart(item, (entry) => this.getItemDisplayPrice(entry));
    const itemId = String(item.id);

    if (result) {
      const message = this.t(result.messageKey);
      this.showItemMessage(result.type, message);

      if (result.messageKey === 'LANDING.ERRORS.MODIFIER_SELECTION_REQUIRED') {
        this.invalidModifierGroupIds.update((current) => ({
          ...current,
          [itemId]: this.getMissingRequiredModifierGroupIds(item)
        }));
      } else {
        this.clearInvalidModifierGroups(item);
      }
    }
  }

  isModifierGroupInvalid(item: any, group: any) {
    return this.invalidModifierGroupIds()[String(item.id)]?.includes(group.id);
  }

  private getMissingRequiredModifierGroupIds(item: any): string[] {
    const groups = this.getActiveModifierGroups(item) || [];
    return groups
      .filter((group: any) => group.required && !(item.selectedModifiers || []).some((selection: any) => selection.groupId === group.id && selection.optionId))
      .map((group: any) => group.id);
  }

  private clearInvalidModifierGroups(item: any) {
    const { [String(item.id)]: removed, ...rest } = this.invalidModifierGroupIds();
    this.invalidModifierGroupIds.set(rest);
  }

  showItemMessage(type: 'success' | 'error', message: string) {
    if (this.itemMessageTimeout) {
      window.clearTimeout(this.itemMessageTimeout);
      this.itemMessageTimeout = null;
    }

    this.itemMessage.set({ type, message });
    this.scheduleItemMessageClear();
  }

  hideItemMessage() {
    if (this.itemMessageTimeout) {
      window.clearTimeout(this.itemMessageTimeout);
      this.itemMessageTimeout = null;
    }
    this.itemMessage.set(null);
  }

  private scheduleItemMessageClear() {
    if (this.itemMessageHovered) {
      return;
    }

    if (this.itemMessageTimeout) {
      window.clearTimeout(this.itemMessageTimeout);
    }

    this.itemMessageTimeout = window.setTimeout(() => {
      this.itemMessage.set(null);
      this.itemMessageTimeout = null;
    }, 2200);
  }

  onItemMessageMouseEnter() {
    this.itemMessageHovered = true;
    if (this.itemMessageTimeout) {
      window.clearTimeout(this.itemMessageTimeout);
      this.itemMessageTimeout = null;
    }
  }

  onItemMessageMouseLeave() {
    this.itemMessageHovered = false;
    this.scheduleItemMessageClear();
  }

  updateQuantity(entryId: number, delta: number) {
    this.cartFlowService.updateQuantity(entryId, delta);
  }

  updateNotes(entryId: number, notes: string) {
    this.cartFlowService.updateNotes(entryId, notes);
  }

  removeFromCart(entryId: number) {
    this.cartFlowService.removeFromCart(entryId);
  }

  continueToCheckout() {
    this.cartFlowService.continueToCheckout(this.cart().length, (key) => this.t(key));
  }

  goToConfirmation() {
    this.cartFlowService.goToConfirmation(this.customerPhone(), (key) => this.t(key));
  }

  placeOrder() {
    const restaurant = this.selectedRestaurant();
    const branch = this.selectedBranch();
    if (!restaurant || !branch || this.orderSubmitting()) {
      return;
    }

    const payload = this.landingOrderService.buildCreateOrderPayload({
      restaurantId: restaurant.id,
      branchId: branch.id,
      customerName: this.customerName(),
      customerPhone: this.customerPhone(),
      orderType: this.orderType(),
      paymentMethod: this.paymentMethod(),
      orderNotes: this.orderNotes(),
      cart: this.cart(),
      street: this.street(),
      houseNumber: this.houseNumber(),
      apartment: this.apartment(),
      floor: this.floor(),
      city: this.city()
    });

    this.cartFlowService.placeOrder(
      payload,
      (order) => {
        this.cartFlowService.completeOrder(order);
      },
      (message) => {
        this.cartFlowService.setOrderError(this.t(message));
      }
    );
  }

  toggleSelector() {
    if (this.isSingleRestaurantMode()) {
      this.selectionService.selectBranch(null);
      this.selectionService.selectorCollapsed.set(false);
      this.selectionService.suggestedNearestBranch.set(null);
      this.uiStateService.setMenuLoading(false);
      return;
    }

    this.restaurantFlowService.resetFlowState();
  }

  changeRestaurant() {
    if (this.isSingleRestaurantMode()) {
      this.selectionService.selectBranch(null);
      this.selectionService.selectorCollapsed.set(false);
      this.selectionService.suggestedNearestBranch.set(null);
      return;
    }

    this.selectionService.setSingleRestaurantMode(false);
    this.selectionService.setRestaurantSelection(null, this.branches());
    this.selectionService.setBranchLists(this.branches(), this.restaurants().length > 0 ? this.restaurants() : this.branches());
    this.selectionService.selectBranch(null);
    this.selectionService.selectorCollapsed.set(false);
  }
}
