import { Injectable } from '@angular/core';

export interface RecentOrderReference {
  orderId: string;
  orderNumber?: string;
  createdAt?: string;
  restaurantName?: string;
  branchName?: string;
  total?: number;
  status?: string;
  expiresAt?: string;
}

@Injectable({ providedIn: 'root' })
export class RecentOrdersService {
  private readonly storageKey = 'delta_recent_orders';
  private readonly expirationDays = 7;

  addOrder(order: RecentOrderReference): RecentOrderReference[] {
    const orders = this.getOrders();
    const sanitizedOrder = this.normalizeOrder(order);
    const filtered = orders.filter((entry) => entry.orderId !== sanitizedOrder.orderId);
    filtered.unshift(sanitizedOrder);

    const persistedOrders = filtered.slice(0, 20).map((entry) => ({
      ...entry,
      expiresAt: entry.expiresAt || this.getExpirationDate().toISOString()
    }));

    localStorage.setItem(this.storageKey, JSON.stringify(persistedOrders));
    return persistedOrders;
  }

  getOrders(): RecentOrderReference[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    const rawValue = window.localStorage.getItem(this.storageKey);
    if (!rawValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawValue) as RecentOrderReference[];
      const now = Date.now();
      const activeOrders = (parsed || []).filter((entry) => {
        const expiresAt = entry.expiresAt ? Date.parse(entry.expiresAt) : 0;
        return Number.isFinite(expiresAt) && expiresAt > now;
      });

      if (activeOrders.length !== parsed.length) {
        this.persist(activeOrders);
      }

      return activeOrders.sort((a, b) => this.getTimestamp(b.createdAt) - this.getTimestamp(a.createdAt));
    } catch {
      this.clear();
      return [];
    }
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  private normalizeOrder(order: RecentOrderReference): RecentOrderReference {
    const createdAt = order.createdAt || new Date().toISOString();
    return {
      ...order,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      createdAt,
      restaurantName: order.restaurantName,
      branchName: order.branchName,
      total: order.total,
      status: order.status,
      expiresAt: order.expiresAt || this.getExpirationDate().toISOString()
    };
  }

  private getExpirationDate(): Date {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + this.expirationDays);
    return expirationDate;
  }

  private getTimestamp(value?: string): number {
    if (!value) {
      return 0;
    }
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private persist(orders: RecentOrderReference[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(orders));
  }
}
