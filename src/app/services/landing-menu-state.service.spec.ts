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

    const selections = service.toggleModifier('item-1', 'group-1', { id: 'o-1', name: 'Cheese' }, 1, []);
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
});
