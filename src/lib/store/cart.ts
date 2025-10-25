import { create } from 'zustand';
import type { EvaluationResult } from '@/lib/promotions/evaluator';

export interface CartItem {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  modifiers?: any[];
}

interface CartState {
  sessionId: string;
  items: CartItem[];
  tax_rate: number;
  discount: number;
  appliedPromotions: EvaluationResult[];
  
  // Actions
  setSessionId: (id: string) => void;
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
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
  
  setSessionId: (id) => set({ sessionId: id }),
  
  addItem: (item) => set((state) => {
    // Check if item already exists
    const existing = state.items.find(i => i.menu_item_id === item.menu_item_id);
    if (existing) {
      return {
        items: state.items.map(i =>
          i.menu_item_id === item.menu_item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      };
    }
    
    // Add new item
    return {
      items: [...state.items, { ...item, id: crypto.randomUUID(), quantity: 1 }]
    };
  }),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),
  
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
  
  clearCart: () => set({ items: [], sessionId: crypto.randomUUID(), appliedPromotions: [] }),
  
  applyPromotions: (results) => set({ appliedPromotions: results }),
  
  clearPromotions: () => set({ appliedPromotions: [] }),
  
  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
