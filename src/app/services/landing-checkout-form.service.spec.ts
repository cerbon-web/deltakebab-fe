import { TestBed } from '@angular/core/testing';
import { LandingCheckoutFormService } from './landing-checkout-form.service';

describe('LandingCheckoutFormService', () => {
  let service: LandingCheckoutFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LandingCheckoutFormService);
  });

  it('stores the checkout form values and resets them', () => {
    service.customerName.set('Ada');
    service.customerPhone.set('123');
    service.orderType.set('DELIVERY');

    expect(service.customerName()).toBe('Ada');
    expect(service.customerPhone()).toBe('123');
    expect(service.orderType()).toBe('DELIVERY');

    service.reset();

    expect(service.customerName()).toBe('');
    expect(service.orderType()).toBe('SELF_PICKUP');
  });
});
