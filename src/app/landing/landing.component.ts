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

interface CartItem {
  id: number;
  itemId: number;
  name: string;
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
  branchDistances = signal<Map<string, number>>(new Map());
  detectedAddress = signal<string | null>(null);

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
      return this.menuItems();
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

    try {
      const pos = await this.geo.getCurrentPosition();
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      const detectedAddress = await this.reverseGeocodeLocation(userLat, userLng);
      this.detectedAddress.set(detectedAddress);

      const distancesMap = new Map<string, number>();
      const branchesWithDistance = (restaurant.branches || [])
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

      const sortedBranches = [...branchesWithDistance].sort((a: any, b: any) => {
        const distanceA = a.distance ?? Number.POSITIVE_INFINITY;
        const distanceB = b.distance ?? Number.POSITIVE_INFINITY;
        return distanceA - distanceB;
      });

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

  selectRestaurant(restaurant: any) {
    this.selectedRestaurant.set(restaurant);
    this.selectedBranch.set(null);
    this.suggestedNearestBranch.set(null);
    this.detectedAddress.set(null);
    this.restaurantBranches.set(restaurant.branches || []);
    this.categories.set([]);
    this.menuItems.set([]);
    this.selectedCategory.set(null);
    this.checkoutStep.set('menu');
    this.cartOpen.set(false);
    this.calculateDistancesToBranches(restaurant.branches || []);
  }

  private async calculateDistancesToBranches(branches: any[]) {
    try {
      const pos = await this.geo.getCurrentPosition();
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      const distancesMap = new Map<string, number>();
      branches.forEach((b: any) => {
        const branchLat = Number(b.latitude);
        const branchLng = Number(b.longitude);
        const validCoords = !Number.isNaN(branchLat) && !Number.isNaN(branchLng);
        if (!validCoords) {
          return;
        }

        const distance = haversineDistance(userLat, userLng, branchLat, branchLng);
        distancesMap.set(String(b.id), distance);
      });

      this.branchDistances.set(distancesMap);
    } catch {
      this.branchDistances.set(new Map());
    }
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
    this.loadMenu(this.selectedRestaurant()?.id);
  }

  loadMenu(restaurantId: number | string) {
    this.menuLoading.set(true);
    this.error.set(null);

    this.apiService.getMenu(restaurantId).subscribe({
      next: (menu) => {
        const categories = menu.categories || [];
        const items = menu.items || categories.flatMap((category: any) =>
          (category.items || []).map((item: any) => ({
            ...item,
            category_name: category.name,
            price: Number(item.price ?? item.prices?.[0]?.price ?? 0),
            ingredients: item.description ?? ''
          }))
        );

        this.categories.set(categories);
        this.menuItems.set(items);
        this.selectedCategory.set(categories[0]?.name ?? null);
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

  addToCart(item: any) {
    const existing = this.cart().find((entry) => entry.itemId === item.id && entry.notes === '');
    if (existing) {
      this.cart.set(this.cart().map((entry) => entry.itemId === item.id && entry.notes === ''
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
        price: Number(item.price) || 0,
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
  }
}
