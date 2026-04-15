import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, variant: string) => void;
  updateQuantity: (id: string, variant: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.id === item.id && i.variant === item.variant);
        if (existing) {
          return {
            items: state.items.map(i => 
              (i.id === item.id && i.variant === item.variant) 
                ? { ...i, quantity: i.quantity + item.quantity } : i
            )
          };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (id, variant) => set((state) => ({
        items: state.items.filter(i => !(i.id === id && i.variant === variant))
      })),
      updateQuantity: (id, variant, quantity) => set((state) => ({
        items: state.items.map(i => 
          (i.id === id && i.variant === variant) ? { ...i, quantity } : i
        )
      })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'tmdt-cart-storage',
    }
  )
);