import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LandingCheckoutFormService {
  readonly orderType = signal<'DELIVERY' | 'SELF_PICKUP'>('SELF_PICKUP');
  readonly paymentMethod = signal<'CASH' | 'CARD'>('CASH');
  readonly customerName = signal('');
  readonly customerPhone = signal('');
  readonly customerEmail = signal('');
  readonly street = signal('');
  readonly houseNumber = signal('');
  readonly apartment = signal('');
  readonly floor = signal('');
  readonly city = signal('');
  readonly deliveryNotes = signal('');
  readonly orderNotes = signal('');

  reset() {
    this.orderType.set('SELF_PICKUP');
    this.paymentMethod.set('CASH');
    this.customerName.set('');
    this.customerPhone.set('');
    this.customerEmail.set('');
    this.street.set('');
    this.houseNumber.set('');
    this.apartment.set('');
    this.floor.set('');
    this.city.set('');
    this.deliveryNotes.set('');
    this.orderNotes.set('');
  }

  hasRequiredPhone(phone: string) {
    return phone.trim().length > 0;
  }
}
