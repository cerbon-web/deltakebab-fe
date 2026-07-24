import { Injectable, signal } from '@angular/core';
import { MenuItem, MenuModifierGroup, MenuModifierOption } from '../types/domain';

@Injectable({ providedIn: 'root' })
export class LandingMenuStateService {
  readonly menuItems = signal<MenuItem[]>([]);

  setMenuItems(items: MenuItem[]) {
    this.menuItems.set(items);
  }

  updateMenuItem(itemId: string | number, updates: Partial<MenuItem>) {
    this.menuItems.set(this.menuItems().map((item) => (
      item.id === itemId ? { ...item, ...updates } : item
    )));
  }

  selectSize(itemId: string | number, sizeId: string) {
    const items = this.menuItems();
    const item = items.find((entry) => entry.id === itemId);
    const size = item?.sizes?.find((entry) => entry.id === sizeId);
    const defaultSelections = (size?.modifierGroups || item?.modifierGroups || [])
      .flatMap((group: MenuModifierGroup) => {
        const defaultOptions = (group.options || []).filter((option) => option.defaultSelected);
        const selectedOptions = defaultOptions.length > 0
          ? defaultOptions
          : (group.maxSelections ?? 1) <= 1 && (group.options || []).length > 0
            ? [(group.options || [])[0]]
            : [];

        return selectedOptions.map((option) => ({
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          name: option.name,
          price: Number(option.price ?? 0)
        }));
      });

    this.updateMenuItem(itemId, {
      selectedSizeId: sizeId,
      selectedModifiers: defaultSelections
    });
  }

  toggleModifier(itemId: string | number, groupId: string, option: MenuModifierOption, maxSelections: number, existingSelections: Array<{ groupId: string; optionId?: string; name: string; price: number }> = [], required: boolean = false) {
    const currentSelections = existingSelections || [];
    const groupSelections = currentSelections.filter((selected) => selected.groupId === groupId);
    const remainingSelections = currentSelections.filter((selected) => selected.groupId !== groupId);
    const alreadySelected = groupSelections.some((selected) => selected.optionId === option.id);

    if (maxSelections <= 1) {
      if (alreadySelected) {
        return required ? currentSelections : remainingSelections;
      }

      return [
        ...remainingSelections,
        {
          groupId,
          optionId: option.id,
          name: option.name,
          price: Number(option.price ?? 0)
        }
      ];
    }

    if (alreadySelected) {
      return currentSelections.filter((selected) => !(selected.groupId === groupId && selected.optionId === option.id));
    }

    if (groupSelections.length >= maxSelections) {
      return currentSelections;
    }

    return [
      ...remainingSelections,
      ...groupSelections,
      {
        groupId,
        optionId: option.id,
        name: option.name,
        price: Number(option.price ?? 0)
      }
    ];
  }

  isModifierSelected(item: MenuItem, group: MenuModifierGroup, option: MenuModifierOption) {
    return (item.selectedModifiers || []).some((selected) => selected.groupId === group.id && selected.optionId === option.id);
  }

  buildSelectedModifiers(item: MenuItem, group: MenuModifierGroup | null, selectedModifiers: Array<{ groupId: string; groupName?: string; optionId?: string; name: string; price: number }> = []) {
    return (selectedModifiers || []).map((modifier) => ({
      groupId: modifier.groupId,
      groupName: modifier.groupName,
      optionId: modifier.optionId,
      name: modifier.name,
      price: Number(modifier.price ?? 0)
    }));
  }
}
