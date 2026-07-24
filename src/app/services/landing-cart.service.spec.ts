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

  it('merges cart entries for the same product, size, and modifier IDs across languages', () => {
    const item = {
      id: 'item-3',
      name: 'Chicken',
      sizes: [],
      modifierGroups: [],
      selectedModifiers: []
    } as any;

    const polishSelection = [
      { groupId: 'group-1', groupName: 'Krem', optionId: 'option-1', name: 'Łagodny', price: 1 },
      { groupId: 'group-2', groupName: 'Pikantność', optionId: 'option-2', name: 'Ostry', price: 2 }
    ];
    const englishSelection = [
      { groupId: 'group-1', groupName: 'Sauce', optionId: 'option-1', name: 'Mild', price: 1 },
      { groupId: 'group-2', groupName: 'Spice', optionId: 'option-2', name: 'Hot', price: 2 }
    ];

    service.addToCart(item, 18, { id: 'size-1', name: 'Duży' }, polishSelection);
    service.addToCart(item, 18, { id: 'size-1', name: 'Large' }, englishSelection);

    expect(service.cart().length).toBe(1);
    expect(service.cart()[0].quantity).toBe(2);
    expect(service.cart()[0].sizeId).toBe('size-1');
  });

  it('keeps distinct cart entries when modifier option IDs differ', () => {
    const item = {
      id: 'item-4',
      name: 'Chicken',
      sizes: [],
      modifierGroups: [],
      selectedModifiers: []
    } as any;

    service.addToCart(item, 18, { id: 'size-1', name: 'Duży' }, [
      { groupId: 'group-1', groupName: 'Krem', optionId: 'option-1', name: 'Łagodny', price: 1 }
    ]);
    service.addToCart(item, 18, { id: 'size-1', name: 'Duży' }, [
      { groupId: 'group-1', groupName: 'Krem', optionId: 'option-2', name: 'Ostry', price: 2 }
    ]);

    expect(service.cart().length).toBe(2);
    expect(service.cart().map(entry => entry.quantity)).toEqual([1, 1]);
  });

  it('moves checkout through the expected steps', () => {
    service.beginCheckout();
    expect(service.checkoutStep()).toBe('details');

    service.goToConfirmation();
    expect(service.checkoutStep()).toBe('confirm');
  });
});
