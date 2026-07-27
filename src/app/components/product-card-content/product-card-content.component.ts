import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LandingMenuStateService } from '../../services/landing-menu-state.service';
import { LandingViewModelService } from '../../services/landing-view-model.service';

@Component({
  selector: 'app-product-card-content',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './product-card-content.component.html',
  styleUrls: ['../../landing/landing.component.scss']
})
export class ProductCardContentComponent {
  @Input() item: any;
  @Input() itemDisplayPrice: number = 0;
  @Input() itemImageAvailable = false;
  @Input() itemImageUrl: string | null = null;

  constructor(
    private menuStateService: LandingMenuStateService,
    private viewModelService: LandingViewModelService
  ) {}

  @Output() sizeSelected = new EventEmitter<string>();
  @Output() modifierToggled = new EventEmitter<{ group: any; option: any }>();
  @Output() customizeClicked = new EventEmitter<void>();
  @Output() quickAddClicked = new EventEmitter<MouseEvent>();

  get cardModifierGroup() {
    return this.viewModelService.getCardModifierGroup(this.item);
  }

  get modifierSectionTitle() {
    return this.viewModelService.getModifierSectionTitle(this.cardModifierGroup);
  }

  get showInlineModifierSelection() {
    return this.viewModelService.shouldShowInlineModifierSelection(this.item);
  }

  get hasCustomizationOptions() {
    return this.viewModelService.hasCustomizationOptions(this.item);
  }

  get showCustomizeButton() {
    return this.viewModelService.shouldShowCustomizeButton(this.item);
  }

  isModifierSelected(group: any, option: any) {
    return this.menuStateService.isModifierSelected(this.item, group, option);
  }

  onSizeSelect(sizeId: string) {
    this.sizeSelected.emit(sizeId);
  }

  onModifierToggle(group: any, option: any) {
    this.modifierToggled.emit({ group, option });
  }

  onCustomize() {
    this.customizeClicked.emit();
  }

  onQuickAdd(event: MouseEvent) {
    this.quickAddClicked.emit(event);
  }
}
