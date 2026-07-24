import { TestBed } from '@angular/core/testing';
import { LandingMenuStateService } from './landing-menu-state.service';

describe('LandingMenuStateService', () => {
  let service: LandingMenuStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LandingMenuStateService);
  });

  it('updates an item and toggles modifiers', () => {
    service.setMenuItems([{ id: 'item-1', name: 'Classic', sizes: [], modifierGroups: [] } as any]);
    service.updateMenuItem('item-1', { selectedSizeId: 'size-1' });

    expect(service.menuItems()[0].selectedSizeId).toBe('size-1');

    const selections = service.toggleModifier('item-1', 'group-1', { id: 'o-1', name: 'Cheese', price: 0 }, 1, []);
    expect(selections.length).toBe(1);
    expect(selections[0].optionId).toBe('o-1');
  });

  it('resets selected modifiers when a new size is selected', () => {
    service.setMenuItems([{ id: 'item-1', name: 'Classic', sizes: [], modifierGroups: [], selectedModifiers: [{ groupId: 'group-1', optionId: 'o-1', name: 'Czosnkowy', price: 2 }] } as any]);

    service.selectSize('item-1', 'size-2');

    const item = service.menuItems()[0];
    expect(item.selectedSizeId).toBe('size-2');
    expect(item.selectedModifiers).toEqual([]);
  });

  it('applies default-selected modifier options for the chosen size', () => {
    service.setMenuItems([{
      id: 'item-1',
      name: 'Classic',
      sizes: [{
        id: 'size-1',
        name: 'Standard',
        price: 10,
        available: true,
        modifierGroups: [{
          id: 'group-1',
          name: 'Sauce',
          maxSelections: 3,
          options: [
            { id: 'o-1', name: 'Łagodny', price: 0, defaultSelected: true },
            { id: 'o-2', name: 'Ostry', price: 0, defaultSelected: true },
            { id: 'o-3', name: 'Ketchup', price: 0 }
          ]
        }]
      }],
      modifierGroups: [],
      selectedModifiers: []
    } as any]);

    service.selectSize('item-1', 'size-1');

    const item = service.menuItems()[0];
    expect(item.selectedModifiers).toEqual([
      { groupId: 'group-1', groupName: 'Sauce', optionId: 'o-1', name: 'Łagodny', price: 0 },
      { groupId: 'group-1', groupName: 'Sauce', optionId: 'o-2', name: 'Ostry', price: 0 }
    ]);
  });
});
