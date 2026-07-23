import { TestBed } from '@angular/core/testing';
import { LandingCartService } from './landing-cart.service';

describe('LandingCartService', () => {
  let service: LandingCartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LandingCartService);
  });

  it('adds a new cart entry and increments an existing one', () => {
    const item = {
      id: 'item-1',
      name: 'Classic',
      sizes: [],
      modifierGroups: [],
      selectedModifiers: []
    } as any;

    service.addToCart(item, 15);
    service.addToCart(item, 15);

    expect(service.cart().length).toBe(1);
    expect(service.cart()[0].quantity).toBe(2);
    expect(service.cart()[0].price).toBe(15);
  });

  it('updates quantity and notes for an existing cart entry', () => {
    const item = {
      id: 'item-2',
      name: 'Special',
      sizes: [],
      modifierGroups: [],
      selectedModifiers: []
    } as any;

    service.addToCart(item, 20);
    service.updateQuantity(1, 1);
    service.updateNotes(1, 'extra sauce');

    expect(service.cart()[0].quantity).toBe(2);
    expect(service.cart()[0].notes).toBe('extra sauce');
  });

  it('moves checkout through the expected steps', () => {
    service.beginCheckout();
    expect(service.checkoutStep()).toBe('details');

    service.goToConfirmation();
    expect(service.checkoutStep()).toBe('confirm');
  });
});
