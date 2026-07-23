export interface Restaurant {
  id: string;
  name: string;
  branches?: Branch[];
  distance_km?: number | null;
  [key: string]: unknown;
}

export interface Branch {
  id: string;
  name: string;
  street?: string | null;
  buildingNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  restaurantId?: string;
  restaurantName?: string;
  distance?: number | null;
  distance_km?: number | null;
  active?: boolean;
}

export interface CartModifier {
  groupId: string;
  groupName: string;
  optionId?: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: number;
  itemId: number;
  name: string;
  sizeName?: string;
  sizeId?: string;
  modifiers?: CartModifier[];
  price: number;
  quantity: number;
  notes: string;
}

export interface MenuModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuModifierGroup {
  id: string;
  name: string;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  options?: MenuModifierOption[];
}

export interface MenuSizeOption {
  id: string;
  name: string;
  price: number;
  available: boolean;
  modifierGroups?: MenuModifierGroup[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  active?: boolean;
  available?: boolean;
  displayOrder?: number;
  featured?: boolean;
  basePrice?: number | null;
  sizes: MenuSizeOption[];
  modifierGroups: MenuModifierGroup[];
  category_id?: string;
  category_name?: string;
  price?: number;
  ingredients?: string | null;
  selectedSizeId?: string | null;
  selectedModifiers?: Array<{ groupId: string; groupName: string; optionId?: string; name: string; price: number }>;
  categoryDisplayOrder?: number;
  itemDisplayOrder?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string | null;
  displayOrder?: number;
  items?: MenuItem[];
  isFeatured?: boolean;
}

export interface CreateOrderPayload {
  branchId: string;
  customerId?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  orderType: 'DELIVERY' | 'SELF_PICKUP';
  paymentMethod?: 'CASH' | 'CARD';
  items: CreateOrderItem[];
  notes?: string | null;
  street?: string | null;
  buildingNumber?: string | null;
  apartmentNumber?: string | null;
  floor?: string | null;
  city?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accessNotes?: string | null;
  restaurantId?: string;
  deliveryAddress?: string;
}

export interface CreateOrderItem {
  itemName?: string;
  name?: string;
  sizeName?: string;
  size?: string;
  quantity: number;
  unitPrice?: number;
  notes?: string | null;
  modifiers?: CreateOrderModifier[];
}

export interface CreateOrderModifier {
  modifierGroupName?: string;
  groupName?: string;
  modifierOptionName?: string;
  name?: string;
  price?: number;
  modifierOptionPrice?: number;
  modifierOptionId?: string;
}

export interface CreateOrderResponse {
  id: string;
  status: string;
  total: number;
}

export interface MenuResponse {
  branch: unknown;
  menu: unknown;
  categories: MenuCategory[];
  items: MenuItem[];
}
