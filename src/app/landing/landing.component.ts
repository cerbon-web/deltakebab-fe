import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { GeolocationService } from '../services/geolocation.service';
import { ApiService } from '../services/api.service';
import { haversineDistance } from '../utils/haversine';
import { getDisplayedBranches } from '../utils/branch-utils';

interface CartItem {
  id: number;
  itemId: number;
  name: string;
  sizeName?: string;
  sizeId?: string;
  price: number;
  quantity: number;
  notes: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, TranslateModule, MatProgressSpinnerModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  private readonly translate = inject(TranslateService);

  restaurants = signal<any[]>([]);
  branches = signal<any[]>([]);
  selectedBranch = signal<any | null>(null);
  selectedRestaurant = signal<any | null>(null);
  categories = signal<any[]>([]);
  menuItems = signal<any[]>([]);
  selectedCategory = signal<string | null>(null);
  cart = signal<CartItem[]>([]);
  error = signal<string | null>(null);
  loading = signal(false);
  menuLoading = signal(false);
  cartOpen = signal(false);
  checkoutStep = signal<'menu' | 'details' | 'confirm' | 'submitted'>('menu');
  orderType = signal<'DELIVERY' | 'SELF_PICKUP'>('SELF_PICKUP');
  paymentMethod = signal<'CASH' | 'CARD'>('CASH');
  customerName = signal('');
  customerPhone = signal('');
  customerEmail = signal('');
  street = signal('');
  houseNumber = signal('');
  apartment = signal('');
  floor = signal('');
  city = signal('');
  deliveryNotes = signal('');
  orderNotes = signal('');
  orderSubmitting = signal(false);
  submittedOrder = signal<any | null>(null);
  selectorCollapsed = signal(false);
  suggestedNearestBranch = signal<any | null>(null);
  restaurantBranches = signal<any[]>([]);
  branchSource = signal<any[]>([]);
  branchDistances = signal<Map<string, number>>(new Map());
  detectedAddress = signal<string | null>(null);
  branchSearchTerm = signal('');

  constructor(
    private geo: GeolocationService,
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadRestaurants();
  }

  private t(key: string, params?: Record<string, unknown>) {
    return this.translate.instant(key, params);
  }

  get cartTotal(): number {
    return this.cart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get filteredMenuItems() {
    const category = this.selectedCategory();
    if (!category) {
      return [];
    }

    const selectedCategoryData = this.categories().find((entry) => entry.name === category);
    if (selectedCategoryData?.isFeatured) {
      return this.menuItems().filter((item) => item.featured);
    }

    return this.menuItems().filter((item) => item.category_name === category);
  }

  loadRestaurants() {
    this.apiService.getRestaurants().subscribe({
      next: (restaurants) => {
        this.restaurants.set(restaurants);
        const branches = restaurants.flatMap((r: any) => (r.branches || []).map((b: any) => ({
          ...b,
          restaurantId: r.id,
          restaurantName: r.name,
          address: [b.street, b.buildingNumber, b.postalCode, b.city].filter(Boolean).join(', ')
        })));
        this.branches.set(branches);
      },
      error: () => {
        this.error.set(this.t('LANDING.ERRORS.RESTAURANT_LIST_UNAVAILABLE'));
      }
    });
  }

  async findNearestBranch() {
    const restaurant = this.selectedRestaurant();
    if (!restaurant || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.detectedAddress.set(null);

    const branchesToEvaluate = this.branchSource().length > 0 ? this.branchSource() : this.normalizeBranches(restaurant.branches || [], restaurant.name);
    this.branchSource.set(branchesToEvaluate);
    this.restaurantBranches.set(getDisplayedBranches(branchesToEvaluate, this.branchSearchTerm()));

    try {
      const pos = await this.geo.getCurrentPosition();
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      const detectedAddress = await this.reverseGeocodeLocation(userLat, userLng);
      this.detectedAddress.set(detectedAddress);

      const distancesMap = new Map<string, number>();
      const branchesWithDistance = branchesToEvaluate
        .map((b: any) => {
          const branchLat = b.latitude;
          const branchLng = b.longitude;
          const validCoords = branchLat != null && branchLng != null && !Number.isNaN(Number(branchLat)) && !Number.isNaN(Number(branchLng));

          if (!validCoords) {
            return { ...b, distance: null };
          }

          const distance = haversineDistance(userLat, userLng, Number(branchLat), Number(branchLng));
          distancesMap.set(String(b.id), distance);
          return { ...b, distance };
        })
        .filter((b: any) => b.distance !== null);

      this.branchDistances.set(distancesMap);

      const sortedBranches = getDisplayedBranches(branchesWithDistance, this.branchSearchTerm());

      this.branchSource.set(branchesWithDistance);
      this.restaurantBranches.set(sortedBranches);

      const nearest = sortedBranches.length > 0 ? sortedBranches[0] : null;

      this.loading.set(false);
      if (nearest) {
        this.suggestedNearestBranch.set(nearest);
      } else {
        this.error.set(this.t('LANDING.ERRORS.BRANCH_LOCATION_UNAVAILABLE'));
      }
    } catch (err: unknown) {
      this.loading.set(false);
      const maybe = err as { code?: number; message?: string };
      const message = maybe?.message?.toLowerCase() ?? '';

      if (message.includes('accuracy')) {
        this.error.set(this.t('LANDING.ERRORS.LOCATION_INACCURATE'));
      } else if (maybe?.code === 1 || message.includes('permission')) {
        this.error.set(this.t('LANDING.ERRORS.LOCATION_PERMISSION_BRANCH'));
      } else if (message.includes('timed out') || message.includes('unavailable') || message.includes('support')) {
        this.error.set(this.t('LANDING.ERRORS.LOCATION_UNAVAILABLE_BRANCH'));
      } else {
        this.error.set(this.t('LANDING.ERRORS.LOCATION_UNAVAILABLE_BRANCH'));
      }
    }
  }

  async findNearestRestaurant() {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const pos = await this.geo.getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      this.apiService.getNearestRestaurants(lat, lng).subscribe({
        next: (restaurants: any[]) => {
          this.restaurants.set(restaurants);
          const branches = restaurants.flatMap((r: any) => (r.branches || []).map((b: any) => ({
            ...b,
            restaurantId: r.id,
            restaurantName: r.name,
            address: [b.street, b.buildingNumber, b.postalCode, b.city].filter(Boolean).join(', ')
          })));
          this.branches.set(branches);

          const nearest = restaurants[0] ?? null;
          this.loading.set(false);
          if (nearest) {
            this.selectRestaurant(nearest);
          } else {
            this.error.set(this.t('LANDING.ERRORS.NEARBY_RESTAURANT_UNAVAILABLE'));
          }
        },
        error: () => {
          this.loading.set(false);
          this.error.set(this.t('LANDING.ERRORS.NEARBY_RESTAURANT_FAILED'));
        }
      });
    } catch (err: unknown) {
      this.loading.set(false);
      const maybe = err as { code?: number; message?: string };
      const message = maybe?.message?.toLowerCase() ?? '';

      if (message.includes('accuracy')) {
        this.error.set(this.t('LANDING.ERRORS.LOCATION_INACCURATE'));
      } else if (maybe?.code === 1 || message.includes('permission')) {
        this.error.set(this.t('LANDING.ERRORS.LOCATION_PERMISSION_RESTAURANT'));
      } else if (message.includes('timed out') || message.includes('unavailable') || message.includes('support')) {
        this.error.set(this.t('LANDING.ERRORS.LOCATION_UNAVAILABLE_BRANCH'));
      } else {
        this.error.set(this.t('LANDING.ERRORS.LOCATION_UNAVAILABLE_BRANCH'));
      }
    }
  }

  private normalizeBranches(branches: any[], restaurantName?: string): any[] {
    return branches.map((branch: any) => ({
      ...branch,
      restaurantName: branch.restaurantName ?? restaurantName ?? '',
      address: [branch.street, branch.buildingNumber, branch.postalCode, branch.city].filter(Boolean).join(', ')
    }));
  }

  selectRestaurant(restaurant: any) {
    const normalizedBranches = this.normalizeBranches(restaurant.branches || [], restaurant.name);

    this.selectedRestaurant.set(restaurant);
    this.suggestedNearestBranch.set(null);
    this.detectedAddress.set(null);
    this.branchSearchTerm.set('');
    this.branchSource.set(normalizedBranches);
    this.restaurantBranches.set(getDisplayedBranches(normalizedBranches, this.branchSearchTerm()));
    this.categories.set([]);
    this.menuItems.set([]);
    this.selectedCategory.set(null);
    this.checkoutStep.set('menu');
    this.cartOpen.set(false);
    this.calculateDistancesToBranches(restaurant.branches || []);

    const branches = restaurant.branches || [];
    if (branches.length === 1) {
      this.selectedBranch.set(branches[0]);
      this.selectorCollapsed.set(true);
      this.loadMenu(branches[0].id);
      return;
    }

    this.selectedBranch.set(null);
  }

  private async calculateDistancesToBranches(branches: any[]) {
    const normalizedBranches = this.normalizeBranches(branches, this.selectedRestaurant()?.name);
    this.branchSource.set(normalizedBranches);
    this.restaurantBranches.set(getDisplayedBranches(normalizedBranches, this.branchSearchTerm()));

    try {
      const pos = await this.geo.getCurrentPosition();
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      const distancesMap = new Map<string, number>();
      const branchesWithDistance = normalizedBranches.map((b: any) => {
        const branchLat = Number(b.latitude);
        const branchLng = Number(b.longitude);
        const validCoords = !Number.isNaN(branchLat) && !Number.isNaN(branchLng);
        if (!validCoords) {
          return { ...b, distance: null };
        }

        const distance = haversineDistance(userLat, userLng, branchLat, branchLng);
        distancesMap.set(String(b.id), distance);
        return { ...b, distance };
      });

      this.branchDistances.set(distancesMap);
      this.branchSource.set(branchesWithDistance);
      this.restaurantBranches.set(getDisplayedBranches(branchesWithDistance, this.branchSearchTerm()));
    } catch {
      this.branchDistances.set(new Map());
      this.restaurantBranches.set(getDisplayedBranches(normalizedBranches, this.branchSearchTerm()));
    }
  }

  onBranchSearchChange(searchTerm: string) {
    this.branchSearchTerm.set(searchTerm);
    this.restaurantBranches.set(getDisplayedBranches(this.branchSource(), searchTerm));
  }

  getDistanceDisplay(branchId: string | number): string {
    const distanceKm = this.branchDistances().get(String(branchId));
    if (distanceKm === undefined || distanceKm === null) {
      return '';
    }
    if (distanceKm < 1) {
      return this.t('LANDING.DISTANCE.METERS', { value: Math.round(distanceKm * 1000) });
    }
    return this.t('LANDING.DISTANCE.KILOMETERS', { value: distanceKm.toFixed(1) });
  }

  private async reverseGeocodeLocation(lat: number, lng: number): Promise<string | null> {
    const language = this.translate.currentLang || this.translate.defaultLang || 'en';
    const params = new HttpParams()
      .set('format', 'jsonv2')
      .set('lat', lat.toString())
      .set('lon', lng.toString())
      .set('zoom', '18')
      .set('addressdetails', '1')
      .set('accept-language', language);

    try {
      const response = await firstValueFrom(this.http.get<any>('https://nominatim.openstreetmap.org/reverse', { params }));
      const address = response?.address ?? {};
      const street = [address.road, address.pedestrian, address.path].filter(Boolean)[0] ?? '';
      const houseNumber = address.house_number ?? '';
      const city = [address.city, address.town, address.village, address.suburb, address.municipality].filter(Boolean)[0] ?? '';

      this.street.set(street);
      this.houseNumber.set(houseNumber);
      this.city.set(city);

      const formatted = [street && houseNumber ? `${street} ${houseNumber}` : street || houseNumber, city].filter(Boolean).join(', ');
      return formatted || response?.display_name || null;
    } catch {
      return null;
    }
  }

  selectBranch(branch: any) {
    this.selectedBranch.set(branch);
    this.suggestedNearestBranch.set(null);
    this.selectorCollapsed.set(true);
    this.loadMenu(branch.id);
  }

  loadMenu(branchId: number | string) {
    this.menuLoading.set(true);
    this.error.set(null);

    this.apiService.getMenu(branchId).subscribe({
      next: (menu) => {
        const baseCategories = (menu?.categories || [])
          .map((category: any) => ({
            ...category,
            displayOrder: category.displayOrder ?? 0,
            items: (category.items || [])
              .map((item: any) => ({
                ...item,
                displayOrder: item.displayOrder ?? 0,
                featured: Boolean(item.featured)
              }))
              .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name))
          }))
          .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name));

        const featuredItems = baseCategories.flatMap((category: any) =>
          (category.items || [])
            .filter((item: any) => item.featured && item.available !== false)
            .map((item: any) => ({
              ...item,
              category_id: category.id,
              category_name: category.name,
              categoryDisplayOrder: category.displayOrder ?? 0,
              itemDisplayOrder: item.displayOrder ?? 0
            }))
        );

        const featuredCategory = featuredItems.length > 0 ? {
          id: 'featured',
          name: 'Top ones',
          icon: null,
          displayOrder: Number.MIN_SAFE_INTEGER,
          isFeatured: true,
          items: featuredItems
            .slice()
            .sort((a: any, b: any) => (a.categoryDisplayOrder ?? 0) - (b.categoryDisplayOrder ?? 0) || (a.itemDisplayOrder ?? 0) - (b.itemDisplayOrder ?? 0) || a.name.localeCompare(b.name))
        } : null;

        const hasServerFeaturedCategory = baseCategories.some((category: any) => category.isFeatured || category.name === 'Top ones');
        const categories = hasServerFeaturedCategory
          ? baseCategories
          : (featuredCategory ? [featuredCategory, ...baseCategories] : baseCategories);
        const items = categories.flatMap((category: any) =>
          (category.items || []).map((item: any) => ({
            ...item,
            category_id: category.id,
            category_name: category.name,
            price: Number(item.sizes?.[0]?.price ?? item.price ?? 0),
            ingredients: item.description ?? ''
          }))
        ).map((item: any) => ({
          ...item,
          sizes: (item.sizes || []).map((size: any) => ({
            id: size.id,
            name: size.name ?? size.sizeOption?.name ?? '',
            price: Number(size.price ?? 0),
            available: size.available ?? true
          })),
          selectedSizeId: item.sizes?.[0]?.id ?? null,
          price: Number((item.sizes || []).find((size: any) => size.id === item.selectedSizeId)?.price ?? item.sizes?.[0]?.price ?? item.price ?? 0),
          ingredients: item.ingredients ?? item.description ?? ''
        }));

        this.categories.set(categories);
        this.menuItems.set(items);
        this.selectedCategory.set(null);
        this.menuLoading.set(false);
      },
      error: () => {
        this.menuLoading.set(false);
        this.error.set(this.t('LANDING.ERRORS.MENU_UNAVAILABLE'));
      }
    });
  }

  chooseCategory(categoryName: string) {
    this.selectedCategory.set(categoryName);
  }

  getSelectedSize(item: any) {
    return item.sizes?.length
      ? (item.sizes.find((size: any) => size.id === item.selectedSizeId) || item.sizes[0])
      : null;
  }

  getItemDisplayPrice(item: any): number {
    const selectedSize = this.getSelectedSize(item);
    return Number(selectedSize?.price ?? item.price ?? 0);
  }

  selectItemSize(item: any, sizeId: string) {
    this.menuItems.set(this.menuItems().map((menuItem) => (
      menuItem.id === item.id && menuItem.category_id === item.category_id
        ? { ...menuItem, selectedSizeId: sizeId }
        : menuItem
    )));
  }

  addToCart(item: any) {
    const selectedSize = item.sizes?.length
      ? item.sizes.find((size: any) => size.id === item.selectedSizeId) || item.sizes[0]
      : null;
    const unitPrice = Number(selectedSize?.price ?? item.price ?? 0);
    const existing = this.cart().find((entry) => entry.itemId === item.id && entry.notes === '' && entry.sizeName === selectedSize?.name);

    if (existing) {
      this.cart.set(this.cart().map((entry) => entry.itemId === item.id && entry.notes === '' && entry.sizeName === selectedSize?.name
        ? { ...entry, quantity: entry.quantity + 1 }
        : entry));
      return;
    }

    this.cart.set([
      ...this.cart(),
      {
        id: Date.now(),
        itemId: item.id,
        name: item.name,
        sizeName: selectedSize?.name,
        sizeId: selectedSize?.id,
        price: unitPrice,
        quantity: 1,
        notes: ''
      }
    ]);
  }

  updateQuantity(itemId: number, delta: number) {
    this.cart.set(this.cart().flatMap((entry) => {
      if (entry.itemId !== itemId) {
        return [entry];
      }

      const quantity = entry.quantity + delta;
      return quantity > 0 ? [{ ...entry, quantity }] : [];
    }));
  }

  updateNotes(itemId: number, notes: string) {
    this.cart.set(this.cart().map((entry) => entry.itemId === itemId ? { ...entry, notes } : entry));
  }

  removeFromCart(itemId: number) {
    this.cart.set(this.cart().filter((entry) => entry.itemId !== itemId));
  }

  continueToCheckout() {
    if (this.cart().length === 0) {
      this.error.set(this.t('LANDING.ERRORS.CART_EMPTY'));
      return;
    }

    this.checkoutStep.set('details');
    this.cartOpen.set(false);
  }

  goToConfirmation() {
    if (!this.customerPhone().trim()) {
      this.error.set(this.t('LANDING.ERRORS.PHONE_REQUIRED'));
      return;
    }

    this.checkoutStep.set('confirm');
  }

  placeOrder() {
    const restaurant = this.selectedRestaurant();
    const branch = this.selectedBranch();
    if (!restaurant || !branch || this.orderSubmitting()) {
      return;
    }

    this.orderSubmitting.set(true);
    this.error.set(null);

    const payload = {
      restaurantId: restaurant.id,
      branchId: branch.id,
      guestName: this.customerName().trim() || undefined,
      guestPhone: this.customerPhone().trim(),
      orderType: this.orderType(),
      paymentMethod: this.paymentMethod(),
      items: this.cart().map((entry) => ({
        itemId: entry.itemId,
        itemName: entry.name,
        sizeName: entry.sizeName,
        quantity: entry.quantity,
        unitPrice: entry.price,
        notes: entry.notes || undefined
      })),
      notes: this.orderNotes().trim() || undefined,
      deliveryAddress: this.orderType() === 'DELIVERY'
        ? [this.street().trim(), this.houseNumber().trim(), this.apartment().trim(), this.floor().trim(), this.city().trim()].filter(Boolean).join(', ')
        : undefined
    };

    this.apiService.createOrder(payload).subscribe({
      next: (order) => {
        this.orderSubmitting.set(false);
        this.submittedOrder.set(order);
        this.checkoutStep.set('submitted');
        this.cart.set([]);
      },
      error: () => {
        this.orderSubmitting.set(false);
        this.error.set(this.t('LANDING.ERRORS.ORDER_PLACE_FAILED'));
      }
    });
  }

  toggleSelector() {
    this.selectorCollapsed.set(false);
    this.selectedBranch.set(null);
    this.suggestedNearestBranch.set(null);
    this.detectedAddress.set(null);
    this.branchSearchTerm.set('');
    this.categories.set([]);
    this.menuItems.set([]);
    this.selectedCategory.set(null);
  }

  changeRestaurant() {
    this.selectedRestaurant.set(null);
    this.selectedBranch.set(null);
    this.categories.set([]);
    this.detectedAddress.set(null);
    this.menuItems.set([]);
    this.selectedCategory.set(null);
    this.selectorCollapsed.set(false);
    this.suggestedNearestBranch.set(null);
    this.branchSearchTerm.set('');
  }
}
