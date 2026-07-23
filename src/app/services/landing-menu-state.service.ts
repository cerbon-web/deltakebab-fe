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
    this.updateMenuItem(itemId, { selectedSizeId: sizeId });
  }

  toggleModifier(itemId: string | number, groupId: string, option: MenuModifierOption, maxSelections: number, existingSelections: Array<{ groupId: string; optionId?: string; name: string; price: number }> = []) {
    const currentSelections = (existingSelections || []).filter((selected) => selected.groupId !== groupId);
    const alreadySelected = currentSelections.some((selected) => selected.optionId === option.id);

    if (maxSelections <= 1) {
      return alreadySelected
        ? currentSelections
        : [
            ...currentSelections,
            {
              groupId,
              optionId: option.id,
              name: option.name,
              price: Number(option.price ?? 0)
            }
          ];
    }

    return alreadySelected
      ? currentSelections
      : [
          ...currentSelections,
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
