import { create } from 'zustand';
import type { EvaluationResult } from '@/lib/promotions/evaluator';

export interface CartModifier {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  modifiers?: CartModifier[];
}

interface CartState {
  sessionId: string;
  items: CartItem[];
  tax_rate: number;
  discount: number;
  appliedPromotions: EvaluationResult[];
  table_id: string | null;
  tableId: string | null; // Alias for convenience
  tableName: string | null;
  tableLabelShort: string | null; // Short label like "t1", "t2"
  nfc_card_id: string | null;
  nfcCardUid: string | null; // For display purposes
  order_type: 'dine_in' | 'takeaway' | null;
  
  // Actions
  setSessionId: (id: string) => void;
  setTableId: (id: string | null) => void;
  setTableName: (name: string | null) => void;
  setTableLabel: (label: string | null) => void;
  setTable: (id: string | null, label?: string | null) => void;
  setTableWithNFC: (tableId: string | null, nfcCardId: string | null, label?: string | null) => void;
  setNFCCardId: (id: string, uid: string) => void;
  clearNFCCard: () => void;
  setOrderType: (type: 'dine_in' | 'takeaway') => void;
  confirmTableChange: (newTableId: string | null, newOrderType?: 'dine_in' | 'takeaway', label?: string | null) => void;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: string) => void;
  voidItem: (id: string, managerId?: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemModifiers: (id: string, modifiers: CartModifier[]) => void;
  clearCart: () => void;
  clearCartItems: () => void;
  applyPromotions: (results: EvaluationResult[]) => void;
  clearPromotions: () => void;
  
  // Computed
  getSubtotal: () => number;
  getTax: () => number;
  getDiscount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  sessionId: crypto.randomUUID(),
  items: [],
  tax_rate: 0.08, // 8% default tax
  discount: 0,
  appliedPromotions: [],
  table_id: null,
  tableId: null,
  tableName: null,
  tableLabelShort: null,
  nfc_card_id: null,
  nfcCardUid: null,
  order_type: null,
  
  setSessionId: (id) => set({ sessionId: id }),
  setTableId: (id) => set({ table_id: id, tableId: id }),
  setTableName: (name) => set({ tableName: name }),
  setTableLabel: (label) => set({ tableLabelShort: label }),
  setTable: (id, label = null) => set({ table_id: id, tableId: id, tableName: label, tableLabelShort: label }),
  setTableWithNFC: (tableId, nfcCardId, label = null) => set({ 
    table_id: tableId, 
    tableId: tableId, 
    nfc_card_id: nfcCardId,
    tableName: label,
    tableLabelShort: label,
    order_type: 'dine_in' 
  }),
  setNFCCardId: (id, uid) => set({ 
    nfc_card_id: id, 
    nfcCardUid: uid 
  }),
  clearNFCCard: () => set({ 
    nfc_card_id: null, 
    nfcCardUid: null 
  }),
  setOrderType: (type) => set({ order_type: type }),
  
  // Confirm table change and clear cart (but preserve NFC card)
  confirmTableChange: (newTableId, newOrderType = 'dine_in', label = null) => set((state) => ({
    items: [],
    sessionId: crypto.randomUUID(),
    appliedPromotions: [],
    table_id: newTableId,
    tableId: newTableId,
    tableName: label,
    tableLabelShort: label,
    order_type: newOrderType,
    // Preserve NFC card across table changes
    nfc_card_id: state.nfc_card_id,
    nfcCardUid: state.nfcCardUid,
  })),
  
  addItem: (item) => set((state) => {
    // Always add as new item (don't auto-merge, modifiers may differ)
    return {
      items: [...state.items, { ...item, id: crypto.randomUUID(), quantity: 1, modifiers: item.modifiers || [] }]
    };
  }),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),
  
  voidItem: async (id, managerId) => {
    const item = get().items.find(i => i.id === id);
    if (!item) return;
    
    // Log void action to audit
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('audit_log').insert({
      actor: managerId || user?.id,
      action: 'void_item',
      entity: 'cart',
      entity_id: id,
      diff: { item_name: item.name, quantity: item.quantity, price: item.price },
      requires_approval: !managerId, // Flag if no manager ID provided
    });
    
    set((state) => ({
      items: state.items.filter(i => i.id !== id)
    }));
  },
  
  updateQuantity: (id, quantity) => set((state) => {
    if (quantity <= 0) {
      return { items: state.items.filter(i => i.id !== id) };
    }
    return {
      items: state.items.map(i =>
        i.id === id ? { ...i, quantity } : i
      )
    };
  }),
  
  updateItemModifiers: (id, modifiers) => set((state) => ({
    items: state.items.map(i =>
      i.id === id ? { ...i, modifiers } : i
    )
  })),
  
  clearCart: () => set({ 
    items: [], 
    sessionId: crypto.randomUUID(), 
    appliedPromotions: [], 
    table_id: null,
    tableId: null,
    tableName: null,
    tableLabelShort: null,
    nfc_card_id: null,
    nfcCardUid: null,
    order_type: null
  }),
  
  // Clear only cart items, preserve order context (table, NFC, type)
  clearCartItems: () => set({ 
    items: [], 
    sessionId: crypto.randomUUID(), 
    appliedPromotions: []
    // Preserve: table_id, nfc_card_id, order_type, table labels
  }),
  
  applyPromotions: (results) => set({ appliedPromotions: results }),
  
  clearPromotions: () => set({ appliedPromotions: [] }),
  
  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => {
      const itemPrice = item.price + (item.modifiers?.reduce((modSum, mod) => modSum + mod.price, 0) || 0);
      return sum + (itemPrice * item.quantity);
    }, 0);
  },
  
  getTax: () => {
    const { tax_rate } = get();
    return get().getSubtotal() * tax_rate;
  },
  
  getDiscount: () => {
    const { appliedPromotions } = get();
    return appliedPromotions.reduce((sum, result) => sum + result.discount, 0);
  },
  
  getTotal: () => {
    return get().getSubtotal() + get().getTax() - get().getDiscount();
  }
}));
