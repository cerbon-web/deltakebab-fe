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
});
