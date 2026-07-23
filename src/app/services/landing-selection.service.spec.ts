import { TestBed } from '@angular/core/testing';
import { LandingSelectionService } from './landing-selection.service';

describe('LandingSelectionService', () => {
  let service: LandingSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LandingSelectionService);
  });

  it('stores restaurant and branch selection state', () => {
    const restaurant = { id: 'r-1', name: 'Delta' } as any;
    const branch = { id: 'b-1', street: 'Main', city: 'Gdańsk' } as any;

    service.setRestaurantSelection(restaurant, [branch]);
    service.selectBranch(branch);

    expect(service.selectedRestaurant()?.id).toBe('r-1');
    expect(service.selectedBranch()?.id).toBe('b-1');
  });

  it('updates menu state and selected category', () => {
    service.setMenuData([{ id: 'c-1', name: 'Burgers' } as any], [{ id: 'i-1', name: 'Classic' } as any]);
    service.chooseCategory('Burgers');

    expect(service.categories().length).toBe(1);
    expect(service.selectedCategory()).toBe('Burgers');
  });
});
