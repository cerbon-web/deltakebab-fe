import { Injectable } from '@angular/core';
import { CartItem, CreateOrderPayload, MenuItem } from '../types/domain';

@Injectable({ providedIn: 'root' })
export class LandingOrderService {
  buildCreateOrderPayload(params: {
    restaurantId: string;
    branchId: string;
    customerName: string;
    customerPhone: string;
    orderType: 'DELIVERY' | 'SELF_PICKUP';
    orderNotes: string;
    cart: CartItem[];
    street: string;
    houseNumber: string;
    apartment: string;
    floor: string;
    city: string;
    paymentMethod?: 'CASH' | 'CARD';
  }): CreateOrderPayload {
    return {
      restaurantId: params.restaurantId,
      branchId: params.branchId,
      guestName: params.customerName.trim() || undefined,
      guestPhone: params.customerPhone.trim(),
      orderType: params.orderType,
      paymentMethod: params.paymentMethod,
      items: params.cart.map((entry) => ({
        itemId: entry.itemId,
        itemName: entry.name,
        sizeName: entry.sizeName,
        quantity: entry.quantity,
        unitPrice: entry.price,
        notes: entry.notes || undefined,
        modifiers: (entry.modifiers || []).map((modifier) => ({
          modifierGroupName: modifier.groupName,
          modifierOptionName: modifier.name,
          modifierOptionId: modifier.optionId,
          price: modifier.price
        }))
      })),
      notes: params.orderNotes.trim() || undefined,
      deliveryAddress: params.orderType === 'DELIVERY'
        ? [params.street.trim(), params.houseNumber.trim(), params.apartment.trim(), params.floor.trim(), params.city.trim()].filter(Boolean).join(', ')
        : undefined
    };
  }

  getItemDisplayPrice(item: MenuItem): number {
    const selectedSize = item.sizes?.length
      ? item.sizes.find((size) => size.id === item.selectedSizeId) || item.sizes[0]
      : null;
    const sizePrice = Number(selectedSize?.price ?? item.basePrice ?? 0);
    const modifierPrice = (item.selectedModifiers || []).reduce((sum, modifier) => sum + Number(modifier.price ?? 0), 0);
    return Number(sizePrice + modifierPrice);
  }
}
