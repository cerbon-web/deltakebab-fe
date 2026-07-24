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
import { CartItem } from '../types/domain';

class MockTranslateService {
  instant = (key: string) => key;
}

describe('LandingComponent navigation state', () => {
  let component: LandingComponent;
  let selectionService: LandingSelectionService;
  let cartService: LandingCartService;

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
    cartService = TestBed.inject(LandingCartService);
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

  it('allows switching to a different branch when the cart is empty', () => {
    const currentBranch = { id: 'branch-a', street: 'Main', city: 'Warsaw' } as any;
    const nextBranch = { id: 'branch-b', street: 'Second', city: 'Warsaw' } as any;

    selectionService.selectBranch(currentBranch);
    component.selectBranch(nextBranch);

    expect(selectionService.selectedBranch()?.id).toBe('branch-b');
  });

  it('allows switching to the same branch when items are present', () => {
    const sameBranch = { id: 'branch-a', street: 'Main', city: 'Warsaw' } as any;
    const cartItem = { id: 1, itemId: 10, name: 'Item', branchId: 'branch-a', price: 10, quantity: 1, notes: '' } as CartItem;

    cartService.cart.set([cartItem]);
    selectionService.selectBranch(sameBranch);
    component.selectBranch(sameBranch);

    expect(selectionService.selectedBranch()?.id).toBe('branch-a');
    expect(cartService.cart().length).toBe(1);
  });

  it('requires confirmation when switching to a different branch with incompatible cart items', () => {
    const currentBranch = { id: 'branch-a', street: 'Main', city: 'Warsaw' } as any;
    const nextBranch = { id: 'branch-b', street: 'Second', city: 'Warsaw' } as any;
    const cartItem = { id: 1, itemId: 10, name: 'Item', branchId: 'branch-a', price: 10, quantity: 1, notes: '' } as CartItem;

    spyOn(window, 'confirm').and.returnValue(false);
    cartService.cart.set([cartItem]);
    selectionService.selectBranch(currentBranch);

    component.selectBranch(nextBranch);

    expect(selectionService.selectedBranch()?.id).toBe('branch-a');
    expect(cartService.cart().length).toBe(1);
  });

  it('clears the cart and switches branches when confirmation is accepted', () => {
    const currentBranch = { id: 'branch-a', street: 'Main', city: 'Warsaw' } as any;
    const nextBranch = { id: 'branch-b', street: 'Second', city: 'Warsaw' } as any;
    const cartItem = { id: 1, itemId: 10, name: 'Item', branchId: 'branch-a', price: 10, quantity: 1, notes: '' } as CartItem;

    spyOn(window, 'confirm').and.returnValue(true);
    cartService.cart.set([cartItem]);
    selectionService.selectBranch(currentBranch);

    component.selectBranch(nextBranch);

    expect(selectionService.selectedBranch()?.id).toBe('branch-b');
    expect(cartService.cart()).toEqual([]);
  });

  it('keeps the branch and cart unchanged when confirmation is canceled', () => {
    const currentBranch = { id: 'branch-a', street: 'Main', city: 'Warsaw' } as any;
    const nextBranch = { id: 'branch-b', street: 'Second', city: 'Warsaw' } as any;
    const cartItem = { id: 1, itemId: 10, name: 'Item', branchId: 'branch-a', price: 10, quantity: 1, notes: '' } as CartItem;

    spyOn(window, 'confirm').and.returnValue(false);
    cartService.cart.set([cartItem]);
    selectionService.selectBranch(currentBranch);

    component.selectBranch(nextBranch);

    expect(selectionService.selectedBranch()?.id).toBe('branch-a');
    expect(cartService.cart().length).toBe(1);
  });
});
