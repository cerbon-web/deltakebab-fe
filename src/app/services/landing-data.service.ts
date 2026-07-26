import { Injectable } from '@angular/core';
import { Branch, MenuCategory, MenuItem, Restaurant } from '../types/domain';

@Injectable({ providedIn: 'root' })
export class LandingDataService {
  normalizeBranches(branches: Array<Partial<Branch> & { id: string }>, restaurantName?: string): Branch[] {
    return (branches || []).map((branch) => ({
      ...branch,
      restaurantName: branch.restaurantName ?? restaurantName ?? '',
      address: [branch.street, branch.buildingNumber, branch.postalCode, branch.city].filter(Boolean).join(', ')
    }) as Branch);
  }

  normalizeRestaurants(restaurants: Restaurant[]): Branch[] {
    return restaurants.flatMap((restaurant) =>
      this.normalizeBranches((restaurant.branches || []).map((branch) => ({
        ...branch,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      })), restaurant.name)
    );
  }

  buildMenuViewModel(menu: { categories?: Array<any> } | null | undefined): { categories: MenuCategory[]; items: MenuItem[] } {
    const baseCategories = (menu?.categories || [])
      .map((category: any) => ({
        ...category,
        displayOrder: category.displayOrder ?? 0,
        items: (category.items || [])
          .map((item: any) => ({
            ...item,
            displayOrder: item.displayOrder ?? 0,
            featured: Boolean(item.featured)
          }))
          .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name))
      }))
      .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name));

    const featuredItems = baseCategories.flatMap((category: any) =>
      (category.items || [])
        .filter((item: any) => item.featured && item.available !== false)
        .map((item: any) => ({
          ...item,
          category_id: category.id,
          category_name: category.name,
          categoryDisplayOrder: category.displayOrder ?? 0,
          itemDisplayOrder: item.displayOrder ?? 0
        }))
    );

    const uniqueFeaturedItems = Array.from(
      featuredItems.reduce((map: Map<string, any>, item: any) => {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
        return map;
      }, new Map<string, any>()).values()
    );

    const hasServerFeaturedCategory = baseCategories.some((category: any) => category.isFeatured || (typeof category.name === 'string' && category.name.trim().toLowerCase() === 'bestsellers'));

    const featuredCategory = uniqueFeaturedItems.length > 0 && !hasServerFeaturedCategory ? {
      id: 'featured',
      name: 'Bestsellers',
      icon: null,
      displayOrder: Number.MIN_SAFE_INTEGER,
      isFeatured: true,
      items: uniqueFeaturedItems
        .slice()
        .sort((a: any, b: any) => (a.categoryDisplayOrder ?? 0) - (b.categoryDisplayOrder ?? 0) || (a.itemDisplayOrder ?? 0) - (b.itemDisplayOrder ?? 0) || a.name.localeCompare(b.name))
    } : null;

    const categories = featuredCategory
      ? [featuredCategory, ...baseCategories]
      : baseCategories;

    const items = categories.flatMap((category: any) =>
      (category.items || []).map((item: any) => ({
        ...item,
        category_id: category.id,
        category_name: category.name,
        price: Number(item.price ?? item.basePrice ?? item.sizes?.[0]?.price ?? 0),
        ingredients: item.description ?? ''
      }))
    ).map((item: any) => {
      const fallbackItemPrice = Number(item.price ?? item.basePrice ?? 0);
      const normalizedSizes = (item.sizes || []).map((size: any) => {
        const sizePrice = Number(size.price ?? 0);
        return {
          id: size.id,
          name: size.name ?? size.sizeOption?.name ?? '',
          price: sizePrice > 0 ? sizePrice : fallbackItemPrice,
          available: size.available ?? true,
          modifierGroups: (size.modifierGroups || []).map((group: any) => ({
            ...group,
            options: (group.options || []).map((option: any) => ({
              ...option,
              price: Number(option.price ?? 0),
              defaultSelected: Boolean(option.defaultSelected)
            }))
          }))
        };
      });

      const normalizedItemModifierGroups = (item.modifierGroups || []).map((group: any) => ({
        ...group,
        options: (group.options || []).map((option: any) => ({
          ...option,
          price: Number(option.price ?? 0),
          defaultSelected: Boolean(option.defaultSelected)
        }))
      }));

      const initialSelectedSizeId = normalizedSizes?.[0]?.id ?? null;
      const initialSelectedSize = normalizedSizes.find((size: any) => size.id === initialSelectedSizeId) || null;
      const initialSelectedSizePrice = Number(initialSelectedSize?.price ?? 0);
      const initialDefaultSelections = (initialSelectedSize?.modifierGroups || normalizedItemModifierGroups || [])
        .flatMap((group: any) => {
          const defaultOptions = (group.options || []).filter((option: any) => option.defaultSelected);
          return defaultOptions.map((option: any) => ({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            name: option.name,
            price: Number(option.price ?? 0)
          }));
        });

      return {
        ...item,
        sizes: normalizedSizes,
        modifierGroups: normalizedItemModifierGroups,
        selectedSizeId: initialSelectedSizeId,
        selectedModifiers: initialDefaultSelections,
        price: initialSelectedSizePrice > 0 ? initialSelectedSizePrice : fallbackItemPrice,
        ingredients: item.ingredients ?? item.description ?? ''
      };
    });

    return { categories, items } as { categories: MenuCategory[]; items: MenuItem[] };
  }
}
