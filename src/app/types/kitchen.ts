export interface KitchenOrderItem {
  id?: string;
  itemName?: string;
  sizeName?: string | null;
  quantity?: number;
  unitPrice?: number;
  notes?: string | null;
  modifiers?: Array<{ modifierGroupNameSnapshot?: string; modifierOptionNameSnapshot?: string; priceSnapshot?: number }>;
}

export interface KitchenOrder {
  id: string;
  orderNumber?: string;
  status: string;
  totalPrice: number;
  deliveryFee?: number;
  createdAt?: string;
  orderType?: string;
  paymentMethod?: 'CASH' | 'CARD';
  customerName?: string | null;
  customerPhone?: string | null;
  branch?: { id: string; name: string; street?: string | null; buildingNumber?: string | null; city?: string | null } | null;
  items?: KitchenOrderItem[];
  notes?: string | null;
  street?: string | null;
  buildingNumber?: string | null;
  apartmentNumber?: string | null;
  floor?: string | null;
  city?: string | null;
  postalCode?: string | null;
  accessNotes?: string | null;
}
