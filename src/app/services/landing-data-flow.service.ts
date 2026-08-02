import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { LandingDataService } from './landing-data.service';
import { LandingCartService } from './landing-cart.service';
import { LandingSelectionService } from './landing-selection.service';
import { LandingUiStateService } from './landing-ui-state.service';
import { LandingOrderService } from './landing-order.service';
import { LandingCheckoutFormService } from './landing-checkout-form.service';
import { LandingMenuStateService } from './landing-menu-state.service';
import { CreateOrderPayload, MenuCategory, MenuItem, Restaurant } from '../types/domain';

@Injectable({ providedIn: 'root' })
export class LandingDataFlowService {
  constructor(
    private apiService: ApiService,
    private landingDataService: LandingDataService,
    private cartService: LandingCartService,
    private selectionService: LandingSelectionService,
    private uiStateService: LandingUiStateService,
    private landingOrderService: LandingOrderService,
    private checkoutFormService: LandingCheckoutFormService,
    private menuStateService: LandingMenuStateService
  ) {}

  loadRestaurants(onSuccess: (restaurants: Restaurant[]) => void, onError: (message: string) => void) {
    this.apiService.getRestaurants().subscribe({
      next: (restaurants) => {
        onSuccess(restaurants);
      },
      error: () => {
        onError('LANDING.ERRORS.RESTAURANT_LIST_UNAVAILABLE');
      }
    });
  }

  loadMenu(branchId: number | string, onSuccess: (categories: MenuCategory[], items: MenuItem[]) => void, onError: (message: string) => void) {
    this.uiStateService.setMenuLoading(true);
    this.cartService.setError(null);

    this.apiService.getMenu(branchId).subscribe({
      next: (menu) => {
        const { categories, items } = this.landingDataService.buildMenuViewModel(menu);
        this.selectionService.setMenuData(categories, items);
        this.menuStateService.setMenuItems(items);
        this.uiStateService.setMenuLoading(false);
        onSuccess(categories, items);
      },
      error: () => {
        this.uiStateService.setMenuLoading(false);
        onError('LANDING.ERRORS.MENU_UNAVAILABLE');
      }
    });
  }

  placeOrder(payload: CreateOrderPayload, onSuccess: (order: unknown) => void, onError: (message: string, errors?: Array<{ field?: string; code: string; message?: string }>, code?: string) => void) {
    this.apiService.createOrder(payload).subscribe({
      next: (order) => onSuccess(order),
      error: (error: Error & { payload?: { code?: string; message?: string; errors?: Array<{ field?: string; code: string; message?: string }> } }) => {
        const payload = error?.payload;
        const fallbackMessage = 'LANDING.ERRORS.ORDER_PLACE_FAILED';
        const normalizedErrors = payload?.errors ?? [];
        onError(payload?.message ? payload.message : fallbackMessage, normalizedErrors, payload?.code);
      }
    });
  }
}
