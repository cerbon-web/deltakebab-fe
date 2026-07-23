import { TestBed } from '@angular/core/testing';
import { LandingComponent } from './landing.component';
import { LandingSelectionService } from '../services/landing-selection.service';
import { GeolocationService } from '../services/geolocation.service';
import { LandingOrderService } from '../services/landing-order.service';
import { LandingCartService } from '../services/landing-cart.service';
import { LandingCheckoutFormService } from '../services/landing-checkout-form.service';
import { LandingMenuStateService } from '../services/landing-menu-state.service';
import { LandingViewModelService } from '../services/landing-view-model.service';
import { LandingUiStateService } from '../services/landing-ui-state.service';
import { LandingRestaurantFlowService } from '../services/landing-restaurant-flow.service';
import { LandingLocationService } from '../services/landing-location.service';
import { LandingDataFlowService } from '../services/landing-data-flow.service';
import { LandingCartFlowService } from '../services/landing-cart-flow.service';
import { TranslateService } from '@ngx-translate/core';

class MockTranslateService {
  instant = (key: string) => key;
}

describe('LandingComponent navigation state', () => {
  let component: LandingComponent;
  let selectionService: LandingSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        { provide: TranslateService, useClass: MockTranslateService },
        { provide: GeolocationService, useValue: {} },
        { provide: LandingOrderService, useValue: {} },
        { provide: LandingCartService, useValue: { cart: () => [], error: () => null, cartTotal: 0, orderSubmitting: () => false, submittedOrder: () => null, resetCheckout: () => {}, setError: () => {} } },
        LandingSelectionService,
        { provide: LandingCheckoutFormService, useValue: { orderType: () => 'SELF_PICKUP', paymentMethod: () => 'CASH', customerName: () => '', customerPhone: () => '', customerEmail: () => '', street: () => '', houseNumber: () => '', apartment: () => '', floor: () => '', city: () => '', deliveryNotes: () => '', orderNotes: () => '', reset: () => {} } },
        { provide: LandingMenuStateService, useValue: { menuItems: () => [], isModifierSelected: () => false, selectSize: () => {} } },
        { provide: LandingViewModelService, useValue: { getFilteredMenuItems: () => [], getSelectedSize: () => null, getActiveModifierGroups: () => [] } },
        { provide: LandingUiStateService, useValue: { loading: () => false, menuLoading: () => false, setLoading: () => {}, setMenuLoading: () => {} } },
        { provide: LandingRestaurantFlowService, useValue: { resetFlowState: () => {}, selectRestaurant: async () => ({ selectedBranch: null }), setRestaurants: () => ({ branches: [] }), normalizeBranches: (branches: any[]) => branches } },
        { provide: LandingLocationService, useValue: { getLocationErrorMessage: () => 'ERROR', reverseGeocodeLocation: async () => null, calculateBranchDistances: () => ({ distancesMap: new Map(), branchesWithDistance: [] }) } },
        { provide: LandingDataFlowService, useValue: { loadRestaurants: (_success: any, _error: any) => {}, loadMenu: (_branchId: any, _success: any, _error: any) => {} } },
        { provide: LandingCartFlowService, useValue: { toggleModifier: () => {}, addToCart: () => {}, updateQuantity: () => {}, updateNotes: () => {}, removeFromCart: () => {}, continueToCheckout: () => {}, goToConfirmation: () => {}, placeOrder: () => {}, completeOrder: () => {}, setOrderError: () => {} } }
      ]
    });

    component = TestBed.createComponent(LandingComponent).componentInstance;
    selectionService = TestBed.inject(LandingSelectionService);
  });

  it('keeps the single-restaurant flow on branch selection when changing branch', () => {
    const restaurant = { id: 1, name: 'Delta', branches: [{ id: 10, street: 'Main', city: 'Gdańsk' }] } as any;
    const branch = restaurant.branches[0];

    selectionService.setSingleRestaurantMode(true);
    selectionService.setRestaurantSelection(restaurant, [branch]);
    selectionService.selectBranch(branch);
    component.restaurants.set([restaurant]);
    component.branches.set([branch]);

    component.changeRestaurant();

    expect(selectionService.isSingleRestaurantMode()).toBeTrue();
    expect(selectionService.selectedRestaurant()?.id).toBe(restaurant.id);
    expect(selectionService.selectedBranch()).toBeNull();
  });
});
