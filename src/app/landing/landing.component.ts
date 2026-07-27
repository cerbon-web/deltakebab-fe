import { Component, ElementRef, ViewChild, inject, OnInit, signal, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
import { environment } from '../../environments/environment';
import { ProductCardContentComponent } from '../components/product-card-content/product-card-content.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, TranslateModule, MatProgressSpinnerModule, ProductCardContentComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, AfterViewInit {
  private readonly translate = inject(TranslateService);

  restaurants = signal<Restaurant[]>([]);
  branches = signal<Branch[]>([]);
  readonly carouselNeedsScroll = signal<boolean>(false);
  get selectedBranch() { return this.selectionService.selectedBranch; }
  get selectedRestaurant() { return this.selectionService.selectedRestaurant; }
  get categories() { return this.selectionService.categories; }
  get menuItems() { return this.menuStateService.menuItems; }
  get selectedCategory() { return this.selectionService.selectedCategory; }
  get cart() { return this.cartService.cart; }
  get error() { return this.cartService.error; }
  get loading() { return this.uiStateService.loading; }
  readonly itemMessage = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  readonly customizationOpen = signal<boolean>(false);
  readonly customizationItem = signal<any | null>(null);
  readonly customizationItemId = signal<string | number | null>(null);
  readonly invalidModifierGroupIds = signal<Record<string, string[]>>({});
  readonly activeTab = signal<'menu' | 'cart'>('menu');
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
    this.translate.onLangChange.subscribe(() => {
      const branch = this.selectedBranch();
      if (branch) {
        this.loadMenu(branch.id);
      }
    });

    this.loadRestaurants();
  }

  ngAfterViewInit(): void {
    this.checkCarouselScroll();
  }

  private checkCarouselScroll(): void {
    const carousel = this.categoryCarousel?.nativeElement;
    if (carousel) {
      // Check if content overflows the visible area
      this.carouselNeedsScroll.set(carousel.scrollWidth > carousel.clientWidth);
    }
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
    const currentBranchId = this.selectedBranch()?.id;
    const targetBranchId = branch?.id;

    if (!branch || currentBranchId === targetBranchId) {
      this.selectionService.selectBranch(branch);
      if (branch) {
        this.loadMenu(branch.id);
      }
      return;
    }

    const hasIncompatibleItems = this.cartService.hasIncompatibleBranchItems(targetBranchId);
    if (!hasIncompatibleItems) {
      this.selectionService.selectBranch(branch);
      this.loadMenu(branch.id);
      return;
    }

    const confirmed = window.confirm(this.t('LANDING.CART.CLEAR_BRANCH_SWITCH_CONFIRM'));
    if (!confirmed) {
      return;
    }

    this.cartService.clearCart();
    this.selectionService.selectBranch(branch);
    this.loadMenu(branch.id);
  }

  @ViewChild('categoryCarousel', { read: ElementRef })
  categoryCarousel?: ElementRef<HTMLDivElement>;

  loadMenu(branchId: number | string) {
    this.dataFlowService.loadMenu(
      branchId,
      (categories, items) => {
        (window as any).__menuDebug = {
          categories,
          firstItem: items.find((item: any) => item.name === 'DELTA ROLLO')
        };
        // Schedule carousel check after view updates
        requestAnimationFrame(() => {
          setTimeout(() => this.checkCarouselScroll(), 0);
        });
      },
      (message) => this.cartService.setError(this.t(message))
    );
  }

  chooseCategory(categoryName: string) {
    this.selectionService.chooseCategory(categoryName);
  }

  clearSelectedCategory() {
    this.selectionService.chooseCategory(null);
  }

  scrollCategoryCarousel(direction: 'left' | 'right') {
    const carousel = this.categoryCarousel?.nativeElement;
    if (!carousel) {
      return;
    }

    const scrollAmount = carousel.clientWidth * 0.7;
    const target = direction === 'left'
      ? Math.max(0, carousel.scrollLeft - scrollAmount)
      : Math.min(carousel.scrollWidth, carousel.scrollLeft + scrollAmount);

    carousel.scrollTo({ left: target, behavior: 'smooth' });
  }

  private getCategoryIconAssetUrl(rawIcon?: string | null): string | null {
    const trimmedIcon = rawIcon?.trim();
    if (!trimmedIcon) {
      return null;
    }

    if (/^https?:\/\//i.test(trimmedIcon)) {
      return trimmedIcon;
    }

    if (/^(\/|\.\/|\.\.\/)/i.test(trimmedIcon)) {
      const baseUrl = environment.apiBaseUrl.replace(/\/api\/?$/, '');
      return `${baseUrl}${trimmedIcon.startsWith('/') ? trimmedIcon : `/${trimmedIcon}`}`;
    }

    return trimmedIcon;
  }

  isCategoryIconImage(category: { icon?: string | null }) {
    const rawIcon = category.icon?.trim();
    const imagePattern = /^(https?:\/\/|\/|\.\/|\.\.\/)/i;
    return Boolean(rawIcon && imagePattern.test(rawIcon));
  }

  isItemImageAvailable(item: { imageUrl?: string | null }) {
    const rawImage = item.imageUrl?.trim();
    return Boolean(rawImage && /^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(rawImage));
  }

  getItemImageUrl(item: { imageUrl?: string | null }) {
    const rawImage = item.imageUrl?.trim();
    if (!rawImage) {
      return null;
    }

    if (/^https?:\/\//i.test(rawImage)) {
      return rawImage;
    }

    if (/^(\/|\.\/|\.\.\/)/i.test(rawImage)) {
      const baseUrl = environment.apiBaseUrl.replace(/\/api\/?$/, '');
      return `${baseUrl}${rawImage.startsWith('/') ? rawImage : `/${rawImage}`}`;
    }

    return rawImage;
  }

  getCategoryIcon(category: { id?: string | number; name: string; icon?: string | null }) {
    const rawIcon = category.icon?.trim();
    const emojiPattern = /[\p{Extended_Pictographic}]/u;
    const imagePattern = /^(https?:\/\/|\/|\.\/|\.\.\/)/i;

    if (rawIcon && emojiPattern.test(rawIcon)) {
      return rawIcon;
    }

    if (rawIcon && imagePattern.test(rawIcon)) {
      return this.getCategoryIconAssetUrl(rawIcon);
    }

    const idIconMap: Record<string, string> = {
      featured: '⭐',
      '1': '🥙',
      '2': '🌯',
      '4': '📦',
      '5': '🥖',
      '6': '🥡',
      '8': '🥗',
      '9': '🧂',
      '10': '🥤'
    };

    if (category.id !== undefined && category.id !== null) {
      const idKey = String(category.id);
      if (idIconMap[idKey]) {
        return idIconMap[idKey];
      }
    }

    const normalized = category.name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .trim();

    const fallbackNameMap: Array<{ matcher: string; icon: string }> = [
      { matcher: 'bestsellers', icon: '⭐' },
      { matcher: 'rollo', icon: '🥙' },
      { matcher: 'tortilla', icon: '🌯' },
      { matcher: 'bulka', icon: '🥖' },
      { matcher: 'box', icon: '📦' },
      { matcher: 'kebab na talerzu', icon: '🥣' },
      { matcher: 'salatki', icon: '🥗' },
      { matcher: 'kapsalon', icon: '🥡' },
      { matcher: 'dodatki', icon: '🧂' },
      { matcher: 'o kurcze', icon: '🍗' },
      { matcher: 'napoje', icon: '🥤' },
      { matcher: 'pizza', icon: '🍕' },
      { matcher: 'burger', icon: '🍔' },
      { matcher: 'sandwich', icon: '🥪' },
      { matcher: 'salad', icon: '🥗' },
      { matcher: 'dessert', icon: '🍰' },
      { matcher: 'cake', icon: '🍰' },
      { matcher: 'drink', icon: '🥤' },
      { matcher: 'coffee', icon: '☕' },
      { matcher: 'tea', icon: '🫖' },
      { matcher: 'soup', icon: '🍲' },
      { matcher: 'pasta', icon: '🍝' },
      { matcher: 'fries', icon: '🍟' }
    ];

    const matched = fallbackNameMap.find((entry) => normalized.includes(entry.matcher));
    return matched?.icon ?? '🍽️';
  }

  getCategoryDisplayName(category: { name: string }): string {
    const normalized = category.name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .trim();

    if (normalized === 'bestsellers') {
      return this.t('LANDING.CATEGORY.BESTSELLERS');
    }

    return category.name;
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
    this.syncCustomizationItem();

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

  getCartItemDisplayName(entry: any): string {
    const currentItem = this.menuItems().find((item: any) => String(item.id) === String(entry?.itemId)) ?? null;
    return currentItem?.name || entry?.name || '';
  }

  getCartItemDisplaySize(entry: any): string | null {
    const currentItem = this.menuItems().find((item: any) => String(item.id) === String(entry?.itemId)) ?? null;
    const matchingSize = currentItem?.sizes?.find((size: any) => String(size.id) === String(entry?.sizeId)) ?? null;
    return matchingSize?.name || entry?.sizeName || null;
  }

  private getCartEntryModifierGroups(entry: any): Array<any> {
    const currentItem = this.menuItems().find((item: any) => String(item.id) === String(entry?.itemId)) ?? null;
    const selectedSize = currentItem?.sizes?.length
      ? currentItem.sizes.find((size: any) => String(size.id) === String(entry?.sizeId)) || currentItem.sizes[0]
      : null;
    const availableGroups = selectedSize?.modifierGroups?.length ? selectedSize.modifierGroups : currentItem?.modifierGroups || [];

    return (entry?.modifiers || []).reduce((groups: Array<{ id: string; name: string; options: Array<any> }>, modifier: any) => {
      const groupId = String(modifier.groupId ?? '');
      const existingGroup = groups.find((group) => group.id === groupId);
      const availableGroup = availableGroups.find((group: any) => String(group.id) === groupId);
      const groupName = availableGroup?.name || modifier.groupName || this.t('LANDING.CART.SELECTIONS');

      if (existingGroup) {
        existingGroup.options.push({
          ...modifier,
          name: this.getCartModifierOptionDisplayName(currentItem, selectedSize, modifier)
        });
        return groups;
      }

      groups.push({
        id: groupId,
        name: groupName,
        options: [{
          ...modifier,
          name: this.getCartModifierOptionDisplayName(currentItem, selectedSize, modifier)
        }]
      });

      return groups;
    }, []);
  }

  private getCartModifierOptionDisplayName(item: any, selectedSize: any, modifier: any): string {
    const groupId = modifier?.groupId;
    const optionId = modifier?.optionId;
    if (!groupId || !optionId) {
      return modifier?.name || '';
    }

    const availableGroups = selectedSize?.modifierGroups?.length ? selectedSize.modifierGroups : item?.modifierGroups || [];
    const matchingGroup = availableGroups.find((group: any) => String(group.id) === String(groupId));
    const matchingOption = (matchingGroup?.options || []).find((option: any) => String(option.id) === String(optionId));

    return matchingOption?.name || modifier?.name || '';
  }

  getModifierSectionTitle(group: any): string {
    const name = (group?.name || '').toLowerCase();
    if (name.includes('size')) {
      return 'Size';
    }
    if (name.includes('meat')) {
      return 'Meat';
    }
    if (name.includes('sauce')) {
      return 'Sauces';
    }
    if (name.includes('extra')) {
      return 'Extras';
    }
    return group?.name || 'Options';
  }

  getCartModifierGroups(entry: any): Array<{ name: string; options: Array<any> }> {
    return this.getCartEntryModifierGroups(entry).map(({ name, options }) => ({ name, options }));
  }

  openCustomization(item: any) {
    this.customizationItemId.set(item?.id ?? null);
    this.customizationItem.set(item);
    this.customizationOpen.set(true);
  }

  closeCustomization() {
    this.customizationOpen.set(false);
    this.customizationItem.set(null);
    this.customizationItemId.set(null);
  }

  private syncCustomizationItem() {
    const activeItemId = this.customizationItemId();
    if (activeItemId === null) {
      this.customizationItem.set(null);
      return;
    }

    const latestItem = this.menuItems().find((item) => item.id === activeItemId) ?? null;
    this.customizationItem.set(latestItem);
  }

  hasCustomizationOptions(item: any): boolean {
    return (item?.sizes?.length || 0) > 1 || (this.getActiveModifierGroups(item) || []).length > 0;
  }

  shouldShowCustomizeButton(item: any): boolean {
    const activeGroups = this.getActiveModifierGroups(item) || [];
    return activeGroups.length > 1;
  }

  shouldShowInlineModifierSelection(item: any): boolean {
    const activeGroups = this.getActiveModifierGroups(item) || [];
    return activeGroups.length === 1;
  }

  getCardModifierGroup(item: any): any {
    const activeGroups = this.getActiveModifierGroups(item) || [];
    return this.shouldShowInlineModifierSelection(item) ? activeGroups[0] : null;
  }

  getCustomizationMode(item: any): 'compact' | 'full' {
    if (!item) {
      return 'compact';
    }

    const activeGroups = this.getActiveModifierGroups(item) || [];
    const totalOptions = activeGroups.reduce((count, group: any) => count + (group.options?.length || 0), 0);
    const hasMultipleSizes = (item.sizes?.length || 0) > 1;
    const hasManyGroups = activeGroups.length > 1;
    const hasLargeGroup = activeGroups.some((group: any) => (group.options?.length || 0) > 3);

    return hasMultipleSizes || hasManyGroups || hasLargeGroup || totalOptions > 5 ? 'full' : 'compact';
  }

  getCustomizationSummary(item: any): string {
    if (!item) {
      return this.t('LANDING.CUSTOMIZATION.DEFAULT_SELECTION');
    }

    const parts: string[] = [];
    const selectedSize = this.getSelectedSize(item);

    if (selectedSize?.name) {
      parts.push(selectedSize.name);
    }

    const selectedModifiers = (item.selectedModifiers || [])
      .map((selection: any) => selection.name)
      .filter(Boolean);

    if (selectedModifiers.length) {
      parts.push(selectedModifiers.slice(0, 3).join(', '));
    }

    return parts.length ? parts.join(' • ') : this.t('LANDING.CUSTOMIZATION.DEFAULT_SELECTION');
  }

  getCustomizationHint(item: any): string {
    const activeGroups = this.getActiveModifierGroups(item) || [];

    if ((item?.sizes?.length || 0) > 1 && activeGroups.length) {
      return this.t('LANDING.CUSTOMIZATION.HINT.SIZE_AND_ADDONS');
    }

    if ((item?.sizes?.length || 0) > 1) {
      return this.t('LANDING.CUSTOMIZATION.HINT.SIZE_ONLY');
    }

    if (activeGroups.length) {
      return this.t('LANDING.CUSTOMIZATION.HINT.OPTION_ONLY');
    }

    return this.t('LANDING.CUSTOMIZATION.HINT.READY_AS_IS');
  }

  quickAddItem(item: any, event?: MouseEvent) {
    const result = this.cartFlowService.addToCart(item, (entry) => this.getItemDisplayPrice(entry));
    const itemId = String(item.id);

    if (result?.success) {
      const summary = this.getCustomizationSummary(item);
      const message = summary === 'Default selection' ? item.name : `${item.name} • ${summary}`;
      this.showItemMessage('success', message);
      this.clearInvalidModifierGroups(item);
      this.closeCustomization();
      this.triggerAddAnimation(event?.currentTarget as HTMLElement | null);
      return;
    }

    const message = this.t(result?.messageKey ?? 'LANDING.ERRORS.MODIFIER_SELECTION_REQUIRED');
    this.showItemMessage('error', message);
    this.openCustomization(item);
    this.invalidModifierGroupIds.update((current) => ({
      ...current,
      [itemId]: this.getMissingRequiredModifierGroupIds(item)
    }));
  }

  setActiveTab(tab: 'menu' | 'cart') {
    this.activeTab.set(tab);
  }

  selectItemSize(item: any, sizeId: string) {
    this.menuStateService.selectSize(item.id, sizeId);
    this.syncCustomizationItem();
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
        this.closeCustomization();
      }
    }
  }

  addToCartFromCustomization(event?: MouseEvent) {
    const item = this.customizationItem();
    if (!item) {
      return;
    }

    const result = this.cartFlowService.addToCart(item, (entry) => this.getItemDisplayPrice(entry));
    const itemId = String(item.id);

    if (result?.success) {
      const summary = this.getCustomizationSummary(item);
      const message = summary === 'Default selection' ? item.name : `${item.name} • ${summary}`;
      this.showItemMessage('success', message);
      this.clearInvalidModifierGroups(item);
      this.closeCustomization();
      this.triggerAddAnimation(event?.currentTarget as HTMLElement | null);
      return;
    }

    this.showItemMessage('error', this.t(result?.messageKey ?? 'LANDING.ERRORS.MODIFIER_SELECTION_REQUIRED'));
    this.invalidModifierGroupIds.update((current) => ({
      ...current,
      [itemId]: this.getMissingRequiredModifierGroupIds(item)
    }));
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

  private triggerAddAnimation(originElement: HTMLElement | null) {
    const cartButton = document.querySelector('.mobile-cart-fab') as HTMLElement | null;
    if (!cartButton || !originElement) {
      return;
    }

    const sourceRect = originElement.getBoundingClientRect();
    const targetRect = cartButton.getBoundingClientRect();

    if (!sourceRect || !targetRect) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'cart-add-fly-icon';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.textContent = '🛒';

    Object.assign(overlay.style, {
      position: 'fixed',
      zIndex: '1100',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2.1rem',
      height: '2.1rem',
      borderRadius: '999px',
      background: 'rgba(255,255,255,0.96)',
      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.16)',
      fontSize: '1rem',
      pointerEvents: 'none',
      left: `${sourceRect.left + sourceRect.width / 2}px`,
      top: `${sourceRect.top + sourceRect.height / 2}px`,
      opacity: '1',
      transform: 'translate(-50%, -50%) scale(1)',
      transition: 'left 1600ms cubic-bezier(0.22, 1, 0.36, 1), top 1600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 1600ms ease, transform 1600ms ease'
    });

    document.body.appendChild(overlay);

    window.requestAnimationFrame(() => {
      overlay.style.left = `${targetRect.left + targetRect.width / 2}px`;
      overlay.style.top = `${targetRect.top + targetRect.height / 2}px`;
      overlay.style.opacity = '0';
      overlay.style.transform = 'translate(-50%, -50%) scale(0.25)';
    });

    window.setTimeout(() => overlay.remove(), 650);
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
