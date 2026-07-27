import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LandingMenuStateService } from '../../services/landing-menu-state.service';
import { LandingViewModelService } from '../../services/landing-view-model.service';
import { LandingOrderService } from '../../services/landing-order.service';

@Component({
  selector: 'app-customization-sheet',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './customization-sheet.component.html',
  styleUrls: ['./customization-sheet.component.scss']
})
export class CustomizationSheetComponent {
  private readonly translate = inject(TranslateService);
  private readonly menuStateService = inject(LandingMenuStateService);
  private readonly viewModelService = inject(LandingViewModelService);
  private readonly orderService = inject(LandingOrderService);

  @Input() item: any = null;
  @Input() open = false;
  @Input() invalidModifierGroupIds: Record<string, string[]> = {};

  @Output() closed = new EventEmitter<void>();
  @Output() sizeSelected = new EventEmitter<{ item: any; sizeId: string }>();
  @Output() modifierToggled = new EventEmitter<{ item: any; group: any; option: any }>();
  @Output() addToCart = new EventEmitter<void>();

  get selectedSizeId(): string | null {
    return this.item?.selectedSizeId || this.item?.sizes?.[0]?.id || null;
  }

  get activeModifierGroups() {
    return this.viewModelService.getActiveModifierGroups(this.item);
  }

  get customizationMode(): 'compact' | 'full' {
    if (!this.item) {
      return 'compact';
    }

    const activeGroups = this.activeModifierGroups || [];
    const totalOptions = activeGroups.reduce((count: number, group: any) => count + (group.options?.length || 0), 0);
    const hasMultipleSizes = (this.item.sizes?.length || 0) > 1;
    const hasManyGroups = activeGroups.length > 1;
    const hasLargeGroup = activeGroups.some((group: any) => (group.options?.length || 0) > 3);

    return hasMultipleSizes || hasManyGroups || hasLargeGroup || totalOptions > 5 ? 'full' : 'compact';
  }

  get customizationHint(): string {
    const activeGroups = this.activeModifierGroups || [];

    if ((this.item?.sizes?.length || 0) > 1 && activeGroups.length) {
      return this.translate.instant('LANDING.CUSTOMIZATION.HINT.SIZE_AND_ADDONS');
    }

    if ((this.item?.sizes?.length || 0) > 1) {
      return this.translate.instant('LANDING.CUSTOMIZATION.HINT.SIZE_ONLY');
    }

    if (activeGroups.length) {
      return this.translate.instant('LANDING.CUSTOMIZATION.HINT.OPTION_ONLY');
    }

    return this.translate.instant('LANDING.CUSTOMIZATION.HINT.READY_AS_IS');
  }

  get customizationSummary(): string {
    if (!this.item) {
      return this.translate.instant('LANDING.CUSTOMIZATION.DEFAULT_SELECTION');
    }

    const parts: string[] = [];
    const selectedSize = this.viewModelService.getSelectedSize(this.item);

    if (selectedSize?.name) {
      parts.push(selectedSize.name);
    }

    const selectedModifiers = (this.item.selectedModifiers || [])
      .map((selection: any) => selection.name)
      .filter(Boolean);

    if (selectedModifiers.length) {
      parts.push(selectedModifiers.slice(0, 3).join(', '));
    }

    return parts.length ? parts.join(' • ') : this.translate.instant('LANDING.CUSTOMIZATION.DEFAULT_SELECTION');
  }

  get itemDisplayPrice(): number {
    return this.orderService.getItemDisplayPrice(this.item);
  }

  get modifierSectionTitle(): string {
    const group = this.activeModifierGroups?.[0];
    if (!group) {
      return 'Options';
    }
    const name = (group?.name || '').toLowerCase();
    if (name.includes('size')) {
      return 'Size';
    }
    if (name.includes('meat')) {
      return 'Meat';
    }
    if (name.includes('sauce')) {
      return 'Sauces';
    }
    if (name.includes('extra')) {
      return 'Extras';
    }
    return group?.name || 'Options';
  }

  isModifierSelected(group: any, option: any): boolean {
    return this.menuStateService.isModifierSelected(this.item, group, option);
  }

  isModifierGroupInvalid(group: any): boolean {
    return this.invalidModifierGroupIds[String(this.item?.id)]?.includes(group.id);
  }

  onClose(): void {
    this.closed.emit();
  }

  onSizeSelect(sizeId: string): void {
    this.sizeSelected.emit({ item: this.item, sizeId });
  }

  onModifierToggle(group: any, option: any): void {
    this.modifierToggled.emit({ item: this.item, group, option });
  }

  onAddToCart(): void {
    this.addToCart.emit();
  }
}
