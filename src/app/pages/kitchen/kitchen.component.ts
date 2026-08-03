import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { KitchenOrderService } from '../../services/kitchen-order.service';
import { BranchService } from '../../services/branch.service';
import { KitchenOrder, KitchenOrderItem } from '../../types/kitchen';
import { Branch } from '../../types/domain';
import { NotificationService } from '../../services/notification.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'page-kitchen',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './kitchen.component.html',
  styleUrls: ['./kitchen.component.scss']
})
export class KitchenComponent implements OnInit, OnDestroy {
  public readonly authService = inject(AuthService);
  public readonly kitchenOrderService = inject(KitchenOrderService);
  public readonly branchService = inject(BranchService);
  public readonly notificationService = inject(NotificationService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);

  readonly orders = this.kitchenOrderService.orders;
  readonly isLoading = this.kitchenOrderService.isLoading;
  readonly error = this.kitchenOrderService.error;
  readonly connectionState = this.kitchenOrderService.connectionState;
  readonly notification = this.notificationService.activeNotification;
  readonly isAlerting = this.notificationService.isAlerting;
  readonly staffName = computed(() => this.authService.user()?.name || '');
  readonly branchId = computed(() => this.authService.user()?.branchIds?.[0] || '');
  readonly selectedOrder = signal<KitchenOrder | null>(null);
  readonly branches = signal<Branch[]>([]);
  readonly selectedBranchId = signal<string | null>(null);
  readonly selectedBranch = computed(() => this.branches().find(branch => branch.id === this.selectedBranchId()) ?? null);
  readonly isSuperAdmin = computed(() => this.authService.user()?.roles?.includes('SUPER_ADMIN') ?? false);
  readonly restaurants = computed(() => {
    const restaurantMap = new Map<string, { id: string; name: string; branches: Branch[]; activeOrderCount: number }>();

    for (const branch of this.branches()) {
      const restaurantId = branch.restaurantId || 'unknown';
      const restaurantName = branch.restaurantName || 'Unknown';
      const group = restaurantMap.get(restaurantId) ?? { id: restaurantId, name: restaurantName, branches: [], activeOrderCount: 0 };
      group.branches.push(branch);
      group.activeOrderCount += branch.activeOrderCount ?? 0;
      restaurantMap.set(restaurantId, group);
    }

    return Array.from(restaurantMap.values());
  });

  private socket: any;
  private pollingSubscription: any;

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/kitchen-login']);
      return;
    }

    if (this.isSuperAdmin()) {
      this.loadBranches();
      this.notificationService.requestPermission();
      return;
    }

    const branchId = this.branchId();
    if (!branchId) {
      this.router.navigate(['/kitchen-login']);
      return;
    }

    this.changeBranch(branchId);
    this.notificationService.requestPermission();
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
    this.pollingSubscription?.unsubscribe?.();
  }

  private initializeSocket(branchId: string) {
    this.socket = this.socketService.connect(this.authService.token() ?? undefined);

    if (!this.socket) {
      return;
    }

    this.socket.emit('joinRoom', `branch:${branchId}`);
    this.socket.on('notification', (payload: any) => {
      if (payload?.event === 'order.created') {
        this.kitchenOrderService.fetchOrders(branchId);
        const order = this.kitchenOrderService.orders().find(o => o.id === payload.orderId);
        this.notificationService.notify({
          title: `NEW ORDER ${order?.orderNumber || payload.orderId}`,
          body: `${order?.customerName || 'Guest'} • ${order?.orderType || 'Order'} • ${(order?.items?.length || 0)} items`,
          orderId: payload.orderId
        });
      }

      if (payload?.event === 'order.status.changed') {
        this.kitchenOrderService.fetchOrders(branchId);
      }
    });
  }

  private loadBranches() {
    this.isLoading.set(true);
    this.error.set(null);

    this.branchService.getBranches().subscribe({
      next: (branches) => {
        this.branches.set(branches);
        const branchId = this.branchId() || branches[0]?.id || null;
        this.selectedBranchId.set(branchId);
        this.isLoading.set(false);

        if (branchId) {
          this.changeBranch(branchId);
        }
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Unable to load branches.');
        this.isLoading.set(false);
      }
    });
  }

  selectBranch(branchId: string) {
    if (!branchId || this.selectedBranchId() === branchId) {
      return;
    }
    this.changeBranch(branchId);
  }

  private changeBranch(branchId: string) {
    this.selectedBranchId.set(branchId);
    this.pollingSubscription?.unsubscribe?.();
    this.socketService.disconnect();
    this.kitchenOrderService.fetchOrders(branchId);
    this.pollingSubscription = this.kitchenOrderService.startPolling(branchId, 8000);
    this.initializeSocket(branchId);
  }

  formatOrderNumber(order: KitchenOrder) {
    return order.orderNumber || order.id.slice(0, 8).toUpperCase();
  }

  getTotalItemCount(order: KitchenOrder) {
    return order.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;
  }

  openOrderDetails(order: KitchenOrder, event?: MouseEvent) {
    event?.stopPropagation();
    this.selectedOrder.set(order);
  }

  closeOrderDetails(event?: MouseEvent) {
    event?.stopPropagation();
    this.selectedOrder.set(null);
  }

  getConnectionStateLabel(state: string) {
    switch (state) {
      case 'connected':
        return 'CONNECTION.CONNECTED';
      case 'offline':
        return 'CONNECTION.OFFLINE';
      case 'reconnecting':
        return 'CONNECTION.RECONNECTING';
      default:
        return 'CONNECTION.UNAVAILABLE';
    }
  }

  getStatusLabel(status: string) {
    return `KITCHEN.GROUP.${status}`;
  }

  getOrderTypeLabel(orderType?: string) {
    if (orderType === 'DELIVERY') {
      return 'LANDING.CHECKOUT.ORDER_TYPES.DELIVERY';
    }
    if (orderType === 'SELF_PICKUP') {
      return 'LANDING.CHECKOUT.ORDER_TYPES.SELF_PICKUP';
    }
    return orderType || 'KITCHEN.METHOD';
  }

  getPaymentIcon(paymentMethod?: string) {
    if (paymentMethod === 'CASH') {
      return 'cash';
    }
    if (paymentMethod === 'CARD') {
      return 'credit_card';
    }
    return 'payment';
  }

  getPaymentLabel(paymentMethod?: string) {
    if (paymentMethod === 'CASH') {
      return 'LANDING.CHECKOUT.PAYMENT_METHODS.CASH';
    }
    if (paymentMethod === 'CARD') {
      return 'LANDING.CHECKOUT.PAYMENT_METHODS.CARD';
    }
    if (paymentMethod) {
      return paymentMethod;
    }
    return 'KITCHEN.PAYMENT';
  }

  getOrderItemTotal(item: KitchenOrderItem) {
    return (item.quantity ?? 0) * (item.unitPrice ?? 0);
  }

  getDisplayItemName(item: KitchenOrderItem) {
    const currentLang = this.translateService.currentLang || this.translateService.defaultLang || 'pl';
    const translationKey = `MENU.ITEMS.${item.itemName}`;
    const translated = this.translateService.instant(translationKey);
    return translated && translated !== translationKey ? translated : item.itemName || '';
  }

  getDisplayModifierName(modifier: { modifierGroupNameSnapshot?: string; modifierOptionNameSnapshot?: string }) {
    const currentLang = this.translateService.currentLang || this.translateService.defaultLang || 'pl';
    const groupKey = `MENU.MODIFIERS.GROUPS.${modifier.modifierGroupNameSnapshot}`;
    const optionKey = `MENU.MODIFIERS.OPTIONS.${modifier.modifierOptionNameSnapshot}`;
    const translatedGroup = this.translateService.instant(groupKey);
    const translatedOption = this.translateService.instant(optionKey);

    return {
      group: translatedGroup && translatedGroup !== groupKey ? translatedGroup : modifier.modifierGroupNameSnapshot || '',
      option: translatedOption && translatedOption !== optionKey ? translatedOption : modifier.modifierOptionNameSnapshot || ''
    };
  }

  getOrderTimestamp(createdAt?: string) {
    if (!createdAt) {
      return '';
    }

    const value = new Date(createdAt);
    if (Number.isNaN(value.getTime())) {
      return '';
    }

    const now = new Date();
    const isToday = value.getFullYear() === now.getFullYear()
      && value.getMonth() === now.getMonth()
      && value.getDate() === now.getDate();

    return isToday ? value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : value.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  toggleOrderDetails(order: KitchenOrder, event?: MouseEvent) {
    event?.stopPropagation();
    this.openOrderDetails(order);
  }

  onAction(order: KitchenOrder, status: string, event?: MouseEvent) {
    event?.stopPropagation();
    this.kitchenOrderService.updateOrderStatus(order.id, status).subscribe(updated => {
      if (updated.id) {
        const branchId = this.selectedBranchId() || this.authService.user()?.branchIds?.[0] || '';
        if (branchId) {
          this.kitchenOrderService.fetchOrders(branchId);
        }
        if (this.notificationService.isAlerting()) {
          this.notificationService.stopAlert();
        }
      }
    });
  }

  canTakeAction(status: string) {
    return ['NEW', 'RECEIVED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'IN_DELIVERY', 'DELIVERED'].includes(status);
  }

  getActions(order: KitchenOrder) {
    switch (order.status) {
      case 'NEW':
        return [{ label: 'KITCHEN.ACTIONS.RECEIVE', status: 'RECEIVED' }];
      case 'RECEIVED':
        return [
          { label: 'KITCHEN.ACTIONS.ACCEPT', status: 'ACCEPTED' },
          { label: 'KITCHEN.ACTIONS.REJECT', status: 'CANCELLED' }
        ];
      case 'ACCEPTED':
        return [{ label: 'KITCHEN.ACTIONS.START_PREPARING', status: 'PREPARING' }];
      case 'PREPARING':
        return [{ label: 'KITCHEN.ACTIONS.MARK_READY', status: 'READY_FOR_PICKUP' }];
      case 'READY_FOR_PICKUP':
        return [{ label: 'KITCHEN.ACTIONS.SEND_DELIVERY', status: 'IN_DELIVERY' }];
      case 'IN_DELIVERY':
        return [
          { label: 'KITCHEN.ACTIONS.MARK_DELIVERED', status: 'DELIVERED' },
          { label: 'KITCHEN.ACTIONS.MARK_FAILED', status: 'FAILED_DELIVERY' }
        ];
      case 'DELIVERED':
        return [{ label: 'KITCHEN.ACTIONS.COMPLETE', status: 'FINISHED' }];
      default:
        return [];
    }
  }
}
