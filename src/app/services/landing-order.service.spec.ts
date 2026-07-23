import { LandingOrderService } from './landing-order.service';
import { CartItem, MenuItem } from '../types/domain';

describe('LandingOrderService', () => {
  let service: LandingOrderService;

  beforeEach(() => {
    service = new LandingOrderService();
  });

  it('builds a create-order payload from the landing checkout state', () => {
    const cart: CartItem[] = [
      {
        id: 1,
        itemId: 10,
        name: 'Classic Kebab',
        sizeName: 'Large',
        sizeId: 'size-large',
        price: 18,
        quantity: 1,
        notes: '',
        modifiers: [{ groupId: 'grp-1', groupName: 'Sauce', optionId: 'opt-1', name: 'Garlic', price: 2 }]
      }
    ];

    const payload = service.buildCreateOrderPayload({
      restaurantId: 'restaurant-1',
      branchId: 'branch-1',
      customerName: 'Ada',
      customerPhone: '123456789',
      orderType: 'DELIVERY',
      orderNotes: 'No onions',
      cart,
      street: 'Main St',
      houseNumber: '10',
      apartment: '2',
      floor: '1',
      city: 'Gdańsk'
    });

    expect(payload.branchId).toBe('branch-1');
    expect(payload.items[0].itemName).toBe('Classic Kebab');
    expect(payload.items[0].modifiers?.[0].price).toBe(2);
    expect(payload.deliveryAddress).toContain('Main St');
  });

  it('computes the display price from the selected size and modifiers', () => {
    const item: MenuItem = {
      id: 'item-1',
      name: 'Classic Kebab',
      sizes: [
        { id: 'size-large', name: 'Large', price: 15, available: true },
        { id: 'size-small', name: 'Small', price: 10, available: true }
      ],
      modifierGroups: [],
      selectedSizeId: 'size-large',
      selectedModifiers: [{ groupId: 'grp-1', groupName: 'Sauce', optionId: 'opt-1', name: 'Garlic', price: 2 }]
    } as MenuItem;

    expect(service.getItemDisplayPrice(item)).toBe(17);
  });
});
