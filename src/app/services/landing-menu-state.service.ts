import { Injectable, signal } from '@angular/core';
import { MenuItem, MenuModifierGroup, MenuModifierOption } from '../types/domain';

@Injectable({ providedIn: 'root' })
export class LandingMenuStateService {
  readonly menuItems = signal<MenuItem[]>([]);

  setMenuItems(items: MenuItem[]) {
    this.menuItems.set(items.map((item) => this.ensureSelectedModifiers(item)));
  }

  updateMenuItem(itemId: string | number, updates: Partial<MenuItem>, options: { applyDefaults?: boolean } = {}) {
    this.menuItems.set(this.menuItems().map((item) => {
      if (!this.isSameItemId(item.id, itemId)) {
        return item;
      }

      const shouldApplyDefaults = options.applyDefaults ?? (updates.selectedModifiers === undefined);
      const nextItem = { ...item, ...updates };
      return shouldApplyDefaults ? this.ensureSelectedModifiers(nextItem) : nextItem;
    }));
  }

  private isSameItemId(a: string | number, b: string | number): boolean {
    return String(a) === String(b);
  }

  ensureSelectedModifiers(item: MenuItem): MenuItem {
    const activeGroups = this.getActiveModifierGroups(item);
    const existingSelections = (item.selectedModifiers || []).filter((selection) => selection.optionId != null);

    const defaultSelections = activeGroups.flatMap((group) => this.getDefaultSelectionsForGroup(group, existingSelections));

    if (!defaultSelections.length) {
      return item;
    }

    return {
      ...item,
      selectedModifiers: [...existingSelections, ...defaultSelections]
    };
  }

  private getDefaultSelectionsForGroup(group: MenuModifierGroup, existingSelections: Array<{ groupId: string; groupName?: string; optionId?: string; name: string; price: number }>) {
    const groupSelections = existingSelections.filter((selection) => String(selection.groupId) === String(group.id));
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
          name: option.name,
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
        name: option.name,
        price: Number(option.price ?? 0)
      }];
    }

    return [];
  }

  private getActiveModifierGroups(item: MenuItem) {
    const size = item.sizes?.length ? item.sizes.find((entry) => entry.id === item.selectedSizeId) || item.sizes[0] : null;
    return size?.modifierGroups?.length ? size.modifierGroups : item.modifierGroups || [];
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
    }, { applyDefaults: false });
  }

  toggleModifier(itemId: string | number, groupId: string, option: MenuModifierOption, maxSelections: number, existingSelections: Array<{ groupId: string; groupName?: string; optionId?: string; name: string; price: number }> = [], required: boolean = false, groupName?: string) {
    const currentSelections = existingSelections || [];
    const groupSelections = currentSelections.filter((selected) => String(selected.groupId) === String(groupId));
    const remainingSelections = currentSelections.filter((selected) => String(selected.groupId) !== String(groupId));
    const alreadySelected = groupSelections.some((selected) => String(selected.optionId) === String(option.id));

    if (maxSelections <= 1) {
      if (alreadySelected) {
        return required ? currentSelections : remainingSelections;
      }

      return [
        ...remainingSelections,
        {
          groupId,
          groupName,
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
        groupName,
        optionId: option.id,
        name: option.name,
        price: Number(option.price ?? 0)
      }
    ];
  }

  isModifierSelected(item: MenuItem, group: MenuModifierGroup, option: MenuModifierOption) {
    const selectedGroupModifiers = (item.selectedModifiers || []).filter((selected) => String(selected.groupId) === String(group.id));
    if (selectedGroupModifiers.length > 0) {
      return selectedGroupModifiers.some((selected) => String(selected.optionId) === String(option.id));
    }

    return Boolean(option.defaultSelected);
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
