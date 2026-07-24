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

  addToCart(item: any, unitPrice: number, selectedSize?: { id?: string; name?: string } | null, selectedModifiers: Array<any> = [], branchId?: string | number | null) {
    const normalizedModifiers = this.normalizeModifiers(selectedModifiers);

    const existing = this.cart().find((entry) =>
      this.isSameCartItem(entry, item, selectedSize, normalizedModifiers, branchId)
    );

    if (existing) {
      this.cart.set(this.cart().map((entry) =>
        this.isSameCartItem(entry, item, selectedSize, normalizedModifiers, branchId)
          ? { ...entry, quantity: entry.quantity + 1 }
          : entry
      ));
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
        branchId,
        modifiers: normalizedModifiers,
        price: unitPrice,
        quantity: 1,
        notes: ''
      }
    ]);
  }

  private normalizeModifiers(modifiers: Array<any> = []) {
    return (modifiers || [])
      .map((modifier) => ({
        groupId: modifier.groupId,
        groupName: modifier.groupName,
        optionId: modifier.optionId,
        name: modifier.name,
        price: Number(modifier.price ?? 0)
      }))
      .sort((a, b) => {
        if (a.groupId !== b.groupId) {
          return String(a.groupId).localeCompare(String(b.groupId));
        }
        return String(a.optionId ?? '').localeCompare(String(b.optionId ?? ''));
      });
  }

  private isSameCartItem(entry: any, item: any, selectedSize?: { id?: string; name?: string } | null, normalizedModifiers: Array<any> = [], branchId?: string | number | null) {
    const entrySizeKey = entry.sizeId ?? null;
    const incomingSizeKey = selectedSize?.id ?? null;
    const entryBranchKey = entry.branchId ?? null;
    const incomingBranchKey = branchId ?? null;
    const sameBranch = entryBranchKey === incomingBranchKey || entryBranchKey === null || incomingBranchKey === null;

    return entry.itemId === item.id &&
      entry.notes === '' &&
      sameBranch &&
      entrySizeKey === incomingSizeKey &&
      this.areModifiersEqual(this.normalizeModifiers(entry.modifiers || []), normalizedModifiers);
  }

  private areModifiersEqual(a: Array<any>, b: Array<any>) {
    if (a.length !== b.length) {
      return false;
    }

    return a.every((modifier, index) =>
      modifier.groupId === b[index].groupId &&
      modifier.optionId === b[index].optionId
    );
  }

  hasIncompatibleBranchItems(targetBranchId?: string | number | null): boolean {
    if (!this.cart().length) {
      return false;
    }

    return this.cart().some((entry) => {
      const entryBranchId = entry.branchId ?? null;
      return entryBranchId !== null && entryBranchId !== targetBranchId;
    });
  }

  clearCart() {
    this.cart.set([]);
  }

  updateQuantity(entryId: number, delta: number) {
    this.cart.set(this.cart().flatMap((entry) => {
      if (entry.id !== entryId) {
        return [entry];
      }

      const quantity = entry.quantity + delta;
      return quantity > 0 ? [{ ...entry, quantity }] : [];
    }));
  }

  updateNotes(entryId: number, notes: string) {
    this.cart.set(this.cart().map((entry) => entry.id === entryId ? { ...entry, notes } : entry));
  }

  removeFromCart(entryId: number) {
    this.cart.set(this.cart().filter((entry) => entry.id !== entryId));
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
