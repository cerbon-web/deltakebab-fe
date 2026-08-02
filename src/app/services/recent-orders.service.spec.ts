import { TestBed } from '@angular/core/testing';
import { RecentOrdersService } from './recent-orders.service';

describe('RecentOrdersService', () => {
  let service: RecentOrdersService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecentOrdersService);
  });

  it('stores lightweight references, removes duplicates and keeps newest first', () => {
    service.addOrder({
      orderId: 'order-1',
      orderNumber: '1001',
      createdAt: '2024-01-01T00:00:00.000Z',
      restaurantName: 'Delta',
      branchName: 'Main',
      total: 20,
      status: 'PREPARING'
    });

    service.addOrder({
      orderId: 'order-2',
      orderNumber: '1002',
      createdAt: '2024-01-02T00:00:00.000Z',
      restaurantName: 'Delta',
      branchName: 'Main',
      total: 35,
      status: 'READY'
    });

    service.addOrder({
      orderId: 'order-2',
      orderNumber: '1002',
      createdAt: '2024-01-03T00:00:00.000Z',
      restaurantName: 'Delta',
      branchName: 'Main',
      total: 35,
      status: 'READY'
    });

    const orders = service.getOrders();
    expect(orders.map((item) => item.orderId)).toEqual(['order-2', 'order-1']);
    expect(orders[0].orderNumber).toBe('1002');
  });
});
