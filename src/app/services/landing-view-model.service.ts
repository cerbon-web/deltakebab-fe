import { Injectable } from '@angular/core';
import { MenuCategory, MenuItem } from '../types/domain';

@Injectable({ providedIn: 'root' })
export class LandingViewModelService {
  getFilteredMenuItems(selectedCategory: string | null, categories: MenuCategory[], menuItems: MenuItem[]) {
    if (!selectedCategory) {
      return [];
    }

    const selectedCategoryData = categories.find((entry) => entry.name === selectedCategory);
    if (selectedCategoryData?.isFeatured) {
      const seen = new Set<string>();
      return menuItems
        .filter((item) => item.featured)
        .filter((item) => {
          if (seen.has(item.id)) {
            return false;
          }
          seen.add(item.id);
          return true;
        });
    }

    return menuItems.filter((item) => item.category_name === selectedCategory);
  }

  getSelectedSize(item: MenuItem) {
    return item.sizes?.length
      ? (item.sizes.find((size) => size.id === item.selectedSizeId) || item.sizes[0])
      : null;
  }

  getActiveModifierGroups(item: MenuItem) {
    const selectedSize = this.getSelectedSize(item);
    return selectedSize?.modifierGroups?.length ? selectedSize.modifierGroups : (item.modifierGroups || []);
  }

  shouldShowInlineModifierSelection(item: MenuItem) {
    const activeGroups = this.getActiveModifierGroups(item) || [];
    return activeGroups.length === 1;
  }

  getCardModifierGroup(item: MenuItem) {
    const activeGroups = this.getActiveModifierGroups(item) || [];
    return this.shouldShowInlineModifierSelection(item) ? activeGroups[0] : null;
  }

  getModifierSectionTitle(group: any): string {
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

  hasCustomizationOptions(item: MenuItem) {
    return (item?.sizes?.length || 0) > 1 || (this.getActiveModifierGroups(item) || []).length > 0;
  }

  shouldShowCustomizeButton(item: MenuItem) {
    const activeGroups = this.getActiveModifierGroups(item) || [];
    return activeGroups.length > 1;
  }
}
