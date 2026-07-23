import { TestBed } from '@angular/core/testing';
import { LandingDataService } from './landing-data.service';

describe('LandingDataService', () => {
  let service: LandingDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LandingDataService);
  });

  it('normalizes branches with restaurant metadata and a joined address', () => {
    const branches = service.normalizeBranches([
      {
        id: 'branch-1',
        name: 'Main Branch',
        street: 'Main St',
        buildingNumber: '10',
        postalCode: '12-345',
        city: 'Gdańsk'
      }
    ], 'Delta Kebab');

    expect(branches[0].restaurantName).toBe('Delta Kebab');
    expect(branches[0].address).toBe('Main St, 10, 12-345, Gdańsk');
  });

  it('builds menu categories and flattened items from a menu payload', () => {
    const { categories, items } = service.buildMenuViewModel({
      categories: [
        {
          id: 'cat-1',
          name: 'Burgers',
          displayOrder: 2,
          items: [
            {
              id: 'item-1',
              name: 'Classic',
              description: 'Tasty',
              featured: true,
              displayOrder: 1,
              basePrice: 15
            }
          ]
        }
      ]
    });

    expect(categories[0].name).toBe('Top ones');
    expect(items[0].name).toBe('Classic');
    expect(items[0].ingredients).toBe('Tasty');
  });

  it('does not add a second Top ones category when the server already provides one', () => {
    const { categories } = service.buildMenuViewModel({
      categories: [
        {
          id: 'cat-top',
          name: 'Top ones',
          isFeatured: true,
          displayOrder: 1,
          items: [
            {
              id: 'item-1',
              name: 'Classic',
              description: 'Tasty',
              featured: true,
              displayOrder: 1,
              basePrice: 15
            }
          ]
        }
      ]
    });

    expect(categories.filter((category) => category.name === 'Top ones')).toHaveSize(1);
  });
});
