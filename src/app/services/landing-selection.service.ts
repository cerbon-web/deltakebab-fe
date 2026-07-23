import { Injectable, signal } from '@angular/core';
import { Branch, MenuCategory, MenuItem, Restaurant } from '../types/domain';

@Injectable({ providedIn: 'root' })
export class LandingSelectionService {
  readonly selectedRestaurant = signal<Restaurant | null>(null);
  readonly selectedBranch = signal<Branch | null>(null);
  readonly isSingleRestaurantMode = signal(false);
  readonly categories = signal<MenuCategory[]>([]);
  readonly menuItems = signal<MenuItem[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly selectorCollapsed = signal(false);
  readonly branchSearchTerm = signal('');
  readonly suggestedNearestBranch = signal<Branch | null>(null);
  readonly detectedAddress = signal<string | null>(null);
  readonly restaurantBranches = signal<Branch[]>([]);
  readonly branchSource = signal<Branch[]>([]);
  readonly branchDistances = signal<Map<string, number>>(new Map());

  setRestaurantSelection(restaurant: Restaurant | null, branches: Branch[] = []) {
    this.selectedRestaurant.set(restaurant);
    this.selectedBranch.set(null);
    this.suggestedNearestBranch.set(null);
    this.detectedAddress.set(null);
    this.branchSearchTerm.set('');
    this.branchSource.set(branches);
    this.restaurantBranches.set(branches);
    this.categories.set([]);
    this.menuItems.set([]);
    this.selectedCategory.set(null);
    this.selectorCollapsed.set(false);
  }

  selectBranch(branch: Branch | null) {
    this.selectedBranch.set(branch);
    this.suggestedNearestBranch.set(null);
    this.selectorCollapsed.set(branch !== null);
  }

  chooseCategory(categoryName: string | null) {
    this.selectedCategory.set(categoryName);
  }

  setMenuData(categories: MenuCategory[], menuItems: MenuItem[]) {
    this.categories.set(categories);
    this.menuItems.set(menuItems);
    this.selectedCategory.set(null);
  }

  setSingleRestaurantMode(enabled: boolean) {
    this.isSingleRestaurantMode.set(enabled);
  }

  resetSelection() {
    this.selectedRestaurant.set(null);
    this.selectedBranch.set(null);
    this.categories.set([]);
    this.menuItems.set([]);
    this.selectedCategory.set(null);
    this.selectorCollapsed.set(false);
    this.branchSearchTerm.set('');
    this.suggestedNearestBranch.set(null);
    this.detectedAddress.set(null);
    this.isSingleRestaurantMode.set(false);
    this.restaurantBranches.set([]);
    this.branchSource.set([]);
    this.branchDistances.set(new Map());
  }

  resetSelectionState() {
    this.selectorCollapsed.set(false);
    this.isSingleRestaurantMode.set(false);
    this.selectBranch(null);
    this.suggestedNearestBranch.set(null);
    this.detectedAddress.set(null);
    this.branchSearchTerm.set('');
    this.categories.set([]);
    this.menuItems.set([]);
    this.selectedCategory.set(null);
  }

  setBranchLists(branches: Branch[], filteredBranches: Branch[]) {
    this.branchSource.set(branches);
    this.restaurantBranches.set(filteredBranches);
  }

  setBranchDistances(distances: Map<string, number>) {
    this.branchDistances.set(distances);
  }
}
