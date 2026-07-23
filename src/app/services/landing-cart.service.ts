import { Injectable, signal } from '@angular/core';
import { CartItem } from '../types/domain';

@Injectable({ providedIn: 'root' })
export class LandingCartService {
  readonly cart = signal<CartItem[]>([]);
  readonly checkoutStep = signal<'menu' | 'details' | 'confirm' | 'submitted'>('menu');
  readonly cartOpen = signal(false);
  readonly orderSubmitting = signal(false);
  readonly submittedOrder = signal<any | null>(null);
  readonly error = signal<string | null>(null);

  get cartTotal(): number {
    return this.cart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  addToCart(item: any, unitPrice: number, selectedSize?: { id?: string; name?: string } | null, selectedModifiers: Array<any> = []) {
    const normalizedModifiers = (selectedModifiers || []).map((modifier) => ({
      groupId: modifier.groupId,
      groupName: modifier.groupName,
      optionId: modifier.optionId,
      name: modifier.name,
      price: Number(modifier.price ?? 0)
    }));

    const existing = this.cart().find((entry) => entry.itemId === item.id && entry.notes === '' && entry.sizeName === selectedSize?.name && JSON.stringify(entry.modifiers || []) === JSON.stringify(normalizedModifiers));

    if (existing) {
      this.cart.set(this.cart().map((entry) => entry.itemId === item.id && entry.notes === '' && entry.sizeName === selectedSize?.name && JSON.stringify(entry.modifiers || []) === JSON.stringify(normalizedModifiers)
        ? { ...entry, quantity: entry.quantity + 1 }
        : entry));
      return;
    }

    this.cart.set([
      ...this.cart(),
      {
        id: Date.now(),
        itemId: item.id,
        name: item.name,
        sizeName: selectedSize?.name,
        sizeId: selectedSize?.id,
        modifiers: normalizedModifiers,
        price: unitPrice,
        quantity: 1,
        notes: ''
      }
    ]);
  }

  updateQuantity(itemId: number, delta: number) {
    this.cart.set(this.cart().flatMap((entry) => {
      if (entry.itemId !== itemId) {
        return [entry];
      }

      const quantity = entry.quantity + delta;
      return quantity > 0 ? [{ ...entry, quantity }] : [];
    }));
  }

  updateNotes(itemId: number, notes: string) {
    this.cart.set(this.cart().map((entry) => entry.itemId === itemId ? { ...entry, notes } : entry));
  }

  removeFromCart(itemId: number) {
    this.cart.set(this.cart().filter((entry) => entry.itemId !== itemId));
  }

  beginCheckout() {
    this.checkoutStep.set('details');
    this.cartOpen.set(false);
  }

  goToConfirmation() {
    this.checkoutStep.set('confirm');
  }

  completeOrder(submittedOrder: any) {
    this.submittedOrder.set(submittedOrder);
    this.checkoutStep.set('submitted');
    this.cart.set([]);
    this.orderSubmitting.set(false);
  }

  resetCheckout() {
    this.checkoutStep.set('menu');
    this.cartOpen.set(false);
    this.orderSubmitting.set(false);
    this.submittedOrder.set(null);
  }

  setOrderSubmitting(value: boolean) {
    this.orderSubmitting.set(value);
  }

  setError(message: string | null) {
    this.error.set(message);
  }
}
