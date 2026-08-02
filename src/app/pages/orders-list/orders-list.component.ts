import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RecentOrdersService, RecentOrderReference } from '../../services/recent-orders.service';

@Component({
  selector: 'page-orders-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.scss'
})
export class OrdersListComponent implements OnInit {
  private readonly recentOrdersService = inject(RecentOrdersService);
  readonly orders = signal<RecentOrderReference[]>([]);

  ngOnInit(): void {
    this.orders.set(this.recentOrdersService.getOrders());
  }
}
