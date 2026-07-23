import { TestBed } from '@angular/core/testing';
import { LandingViewModelService } from './landing-view-model.service';

describe('LandingViewModelService', () => {
  let service: LandingViewModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LandingViewModelService);
  });

  it('filters featured items for featured categories', () => {
    const items = [
      { id: 'i-1', name: 'Classic', featured: true, category_name: 'Burgers' } as any,
      { id: 'i-2', name: 'Veggie', featured: false, category_name: 'Burgers' } as any
    ];

    const result = service.getFilteredMenuItems('Top ones', [{ name: 'Top ones', isFeatured: true } as any], items);

    expect(result).toHaveSize(1);
    expect(result[0].name).toBe('Classic');
  });
});
