import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, of, switchMap, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiErrorPayload } from './api.service';
import { AuthService } from './auth.service';
import { KitchenOrder, KitchenOrderItem } from '../types/kitchen';

@Injectable({ providedIn: 'root' })
export class KitchenOrderService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  public readonly orders = signal<KitchenOrder[]>([]);
  public readonly isLoading = signal(false);
  public readonly error = signal<string | null>(null);
  public readonly connectionState = signal<'connected' | 'offline' | 'reconnecting'>('connected');

  constructor() {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.token();
    return new HttpHeaders({ Authorization: token ? `Bearer ${token}` : '' });
  }

  fetchOrders(branchId: string) {
    if (!branchId) {
      this.error.set('Branch is required');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.http
      .get<KitchenOrder[]>(`${environment.apiBaseUrl}/orders/restaurant/list?branchId=${encodeURIComponent(branchId)}`, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        catchError(err => {
          this.connectionState.set('offline');
          const message = (err.error as ApiErrorPayload)?.message || 'Unable to load orders.';
          this.error.set(message);
          return of([] as KitchenOrder[]);
        })
      )
      .subscribe(orders => {
        this.orders.set(orders);
        this.isLoading.set(false);
        if (orders.length && this.connectionState() !== 'connected') {
          this.connectionState.set('connected');
        }
      });
  }

  updateOrderStatus(orderId: string, status: string) {
    return this.http
      .patch<KitchenOrder>(`${environment.apiBaseUrl}/orders/${encodeURIComponent(orderId)}/status`, { status }, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        catchError(err => {
          const message = (err.error as ApiErrorPayload)?.message || 'Unable to update order status.';
          return of({ errorMessage: message } as unknown as KitchenOrder);
        }),
        map(order => order as KitchenOrder)
      );
  }

  startPolling(branchId: string, intervalMs: number = 8000) {
    return timer(0, intervalMs).pipe(
      switchMap(() => {
        this.fetchOrders(branchId);
        return of(true);
      })
    ).subscribe();
  }
}
