import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../services/api.service';
import { CreateOrderResponse } from '../../types/domain';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './order-tracking.component.html',
  styleUrl: './order-tracking.component.scss'
})
export class OrderTrackingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  readonly order = signal<CreateOrderResponse | null>(null);

  getItemLineTotal(item: NonNullable<CreateOrderResponse['items']>[number]): number {
    return Number(item.unitPrice || 0) * Number(item.quantity || 1);
  }

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.apiService.getOrderById(orderId).subscribe({
        next: (order) => this.order.set(order),
        error: () => this.order.set({ id: orderId, status: 'ERROR', totalPrice: 0 })
      });
    }
  }
}
