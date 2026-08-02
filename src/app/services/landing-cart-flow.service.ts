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
    const effectiveModifiers = this.getEffectiveSelectedModifiers(item);
    if (this.hasMissingRequiredSelection(item, effectiveModifiers)) {
      return {
        success: false,
        type: 'error' as const,
        messageKey: 'LANDING.ERRORS.MODIFIER_SELECTION_REQUIRED'
      };
    }

    const selectedSize = item.sizes?.length
      ? item.sizes.find((size) => size.id === item.selectedSizeId) || item.sizes[0]
      : null;
    if (!this.areModifiersEqual(item.selectedModifiers || [], effectiveModifiers)) {
      this.menuStateService.updateMenuItem(item.id, { selectedModifiers: effectiveModifiers }, { applyDefaults: false });
    }

    const selectedModifiers = this.menuStateService.buildSelectedModifiers(item, null, effectiveModifiers);
    const unitPrice = getItemDisplayPrice(item);
    const currentBranchId = this.selectionService.selectedBranch()?.id ?? null;
    this.cartService.addToCart(item, unitPrice, selectedSize, selectedModifiers, currentBranchId);

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

  private getEffectiveSelectedModifiers(item: MenuItem) {
    const selectedModifiers = [...(item.selectedModifiers || [])];
    const activeGroups = this.getActiveModifierGroups(item);

    const defaultModifiers = activeGroups.flatMap((group) => this.getDefaultModifiersForGroup(group, selectedModifiers));

    return [...selectedModifiers, ...defaultModifiers];
  }

  private getDefaultModifiersForGroup(group: { id: string; name: string; maxSelections?: number; options?: Array<{ id?: string; name?: string; price?: number | string; defaultSelected?: boolean }> }, selectedModifiers: Array<{ groupId: string; groupName?: string; optionId?: string; name: string; price: number }>) {
    const groupSelections = selectedModifiers.filter((selection) => String(selection.groupId) === String(group.id));
    const selectedOptionIds = new Set(groupSelections.map((selection) => String(selection.optionId)));
    const defaultOptions = (group.options || []).filter((option) => option.defaultSelected);

    if (defaultOptions.length > 0) {
      const maxSelections = Number(group.maxSelections ?? 1);
      const existingCount = groupSelections.length;
      const availableSlots = maxSelections > 1 ? Math.max(0, maxSelections - existingCount) : (existingCount > 0 ? 0 : 1);

      return defaultOptions.reduce<Array<{ groupId: string; groupName: string; optionId?: string; name: string; price: number }>>((acc, option) => {
        if (selectedOptionIds.has(String(option.id))) {
          return acc;
        }

        if (availableSlots <= 0 || acc.length >= availableSlots) {
          return acc;
        }

        acc.push({
          groupId: String(group.id),
          groupName: group.name,
          optionId: String(option.id),
          name: option.name ?? '',
          price: Number(option.price ?? 0)
        });

        return acc;
      }, []);
    }

    if ((group.maxSelections ?? 1) <= 1 && (group.options || []).length > 0 && groupSelections.length === 0) {
      const option = (group.options || [])[0];
      return [{
        groupId: String(group.id),
        groupName: group.name,
        optionId: String(option.id),
        name: option.name ?? '',
        price: Number(option.price ?? 0)
      }];
    }

    return [];
  }

  private areModifiersEqual(a: Array<any>, b: Array<any>) {
    const normalizedA = this.menuStateService.buildSelectedModifiers({ selectedModifiers: a } as any, null, a);
    const normalizedB = this.menuStateService.buildSelectedModifiers({ selectedModifiers: b } as any, null, b);

    if (normalizedA.length !== normalizedB.length) {
      return false;
    }

    return normalizedA.every((modifier, index) =>
      modifier.groupId === normalizedB[index].groupId &&
      modifier.optionId === normalizedB[index].optionId
    );
  }

  private hasMissingRequiredSelection(item: MenuItem, selectedModifiers: Array<{ groupId: string; groupName?: string; optionId?: string; name: string; price: number }> = []) {
    return this.getActiveModifierGroups(item).some((group) =>
      group.required && (group.maxSelections ?? 1) <= 1 &&
      !selectedModifiers.some((selection) => selection.groupId === group.id && selection.optionId)
    );
  }

  private getActiveModifierGroups(item: MenuItem) {
    const selectedSize = this.getSelectedSize(item);
    return selectedSize?.modifierGroups?.length ? selectedSize.modifierGroups : item.modifierGroups || [];
  }

  toggleModifier(item: MenuItem, group: { id: string; name: string; maxSelections?: number; required?: boolean }, option: { id?: string; name?: string; price?: number | string }, getItemDisplayPrice?: (item: MenuItem) => number) {
    const nextSelections = this.menuStateService.toggleModifier(
      item.id,
      group.id,
      option as any,
      group.maxSelections ?? 1,
      item.selectedModifiers || [],
      group.required ?? false,
      group.name
    );

    this.menuStateService.updateMenuItem(item.id, {
      selectedModifiers: nextSelections.map((selection: any) => ({
        groupId: selection.groupId,
        groupName: selection.groupName ?? group.name,
        optionId: selection.optionId,
        name: selection.name,
        price: selection.price
      }))
    }, { applyDefaults: false });

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

  placeOrder(payload: CreateOrderPayload, onSuccess: (order: unknown) => void, onError: (message: string, errors?: Array<{ field?: string; code: string; message?: string }>, code?: string) => void) {
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
