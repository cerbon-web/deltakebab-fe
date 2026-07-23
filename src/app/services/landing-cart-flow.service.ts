import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LandingCartService } from './landing-cart.service';
import { LandingCheckoutFormService } from './landing-checkout-form.service';
import { LandingMenuStateService } from './landing-menu-state.service';
import { LandingOrderService } from './landing-order.service';
import { LandingDataFlowService } from './landing-data-flow.service';
import { LandingSelectionService } from './landing-selection.service';
import { LandingUiStateService } from './landing-ui-state.service';
import { CreateOrderPayload, MenuItem } from '../types/domain';

@Injectable({ providedIn: 'root' })
export class LandingCartFlowService {
  constructor(
    private cartService: LandingCartService,
    private checkoutFormService: LandingCheckoutFormService,
    private menuStateService: LandingMenuStateService,
    private landingOrderService: LandingOrderService,
    private dataFlowService: LandingDataFlowService,
    private selectionService: LandingSelectionService,
    private uiStateService: LandingUiStateService,
    private translate: TranslateService
  ) {}

  addToCart(item: MenuItem, getItemDisplayPrice: (item: MenuItem) => number) {
    if (this.hasMissingRequiredSelection(item)) {
      return {
        success: false,
        type: 'error' as const,
        messageKey: 'LANDING.ERRORS.MODIFIER_SELECTION_REQUIRED'
      };
    }

    const selectedSize = item.sizes?.length
      ? item.sizes.find((size) => size.id === item.selectedSizeId) || item.sizes[0]
      : null;
    const selectedModifiers = this.menuStateService.buildSelectedModifiers(item, null, item.selectedModifiers || []);
    const unitPrice = getItemDisplayPrice(item);
    this.cartService.addToCart(item, unitPrice, selectedSize, selectedModifiers);

    return {
      success: true,
      type: 'success' as const,
      messageKey: 'LANDING.CART.ADDED_SUCCESS'
    };
  }

  private getSelectedSize(item: MenuItem) {
    return item.sizes?.length
      ? item.sizes.find((size) => size.id === item.selectedSizeId) || item.sizes[0]
      : null;
  }

  private getActiveModifierGroups(item: MenuItem) {
    const selectedSize = this.getSelectedSize(item);
    return selectedSize?.modifierGroups?.length ? selectedSize.modifierGroups : item.modifierGroups || [];
  }

  private hasMissingRequiredSelection(item: MenuItem) {
    const selectedModifiers = item.selectedModifiers || [];

    return this.getActiveModifierGroups(item).some((group) =>
      group.required && (group.maxSelections ?? 1) <= 1 &&
      !selectedModifiers.some((selection) => selection.groupId === group.id && selection.optionId)
    );
  }

  toggleModifier(item: MenuItem, group: { id: string; name: string; maxSelections?: number; required?: boolean }, option: { id?: string; name?: string; price?: number | string }, getItemDisplayPrice?: (item: MenuItem) => number) {
    const nextSelections = this.menuStateService.toggleModifier(
      item.id,
      group.id,
      option as any,
      group.maxSelections ?? 1,
      item.selectedModifiers || [],
      group.required ?? false
    );

    this.menuStateService.updateMenuItem(item.id, {
      selectedModifiers: nextSelections.map((selection: any) => ({
        groupId: selection.groupId,
        groupName: group.name,
        optionId: selection.optionId,
        name: selection.name,
        price: selection.price
      }))
    });

    return nextSelections;
  }

  updateQuantity(entryId: number, delta: number) {
    this.cartService.updateQuantity(entryId, delta);
  }

  updateNotes(entryId: number, notes: string) {
    this.cartService.updateNotes(entryId, notes);
  }

  removeFromCart(entryId: number) {
    this.cartService.removeFromCart(entryId);
  }

  continueToCheckout(cartLength: number, translate: (key: string) => string) {
    if (cartLength === 0) {
      this.cartService.setError(translate('LANDING.ERRORS.CART_EMPTY'));
      return false;
    }

    this.cartService.beginCheckout();
    return true;
  }

  goToConfirmation(customerPhone: string, translate: (key: string) => string) {
    if (!this.checkoutFormService.hasRequiredPhone(customerPhone)) {
      this.cartService.setError(translate('LANDING.ERRORS.PHONE_REQUIRED'));
      return false;
    }

    this.cartService.goToConfirmation();
    return true;
  }

  placeOrder(payload: CreateOrderPayload, onSuccess: (order: unknown) => void, onError: (message: string) => void) {
    this.cartService.setOrderSubmitting(true);
    this.cartService.setError(null);
    this.dataFlowService.placeOrder(payload, onSuccess, onError);
  }

  completeOrder(order: unknown) {
    this.cartService.completeOrder(order);
  }

  setOrderSubmitting(value: boolean) {
    this.cartService.setOrderSubmitting(value);
  }

  setOrderError(message: string) {
    this.cartService.setOrderSubmitting(false);
    this.cartService.setError(message);
  }
}
