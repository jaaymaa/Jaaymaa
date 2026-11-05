import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/schema";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string>;
  optionsString?: string;
}

interface CartState {
  shopId: string | null;
  items: CartItem[];
  addItem: (
    product: Product,
    selectedOptions?: Record<string, string>,
    quantity?: number
  ) => void;
  removeItem: (productId: string, optionsString?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    optionsString?: string
  ) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

function formatOptionsString(
  options?: Record<string, string>
): string | undefined {
  if (!options) return undefined;
  const entries = Object.entries(options).filter(([, v]) => Boolean(v));
  if (entries.length === 0) return undefined;
  return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      shopId: null,
      items: [],

      addItem: (
        product: Product,
        selectedOptions?: Record<string, string>,
        quantity: number = 1
      ) =>
        set((state) => {
          const qtyToAdd = Math.max(1, quantity);
          const optionsStr = formatOptionsString(selectedOptions);

          // If adding a product from a different shop, clear the cart first
          if (state.shopId && state.shopId !== product.shopId) {
            return {
              shopId: product.shopId,
              items: [
                {
                  product,
                  quantity: qtyToAdd,
                  selectedOptions,
                  optionsString: optionsStr,
                },
              ],
            };
          }

          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              (item.optionsString || "") === (optionsStr || "")
          );

          if (existingIndex > -1) {
            const nextItems = [...state.items];
            nextItems[existingIndex] = {
              ...nextItems[existingIndex],
              quantity: nextItems[existingIndex].quantity + qtyToAdd,
            };
            return {
              shopId: product.shopId,
              items: nextItems,
            };
          }

          return {
            shopId: product.shopId,
            items: [
              ...state.items,
              {
                product,
                quantity: qtyToAdd,
                selectedOptions,
                optionsString: optionsStr,
              },
            ],
          };
        }),

      removeItem: (productId: string, optionsString?: string) =>
        set((state) => {
          const newItems = state.items.filter(
            (item) =>
              !(
                item.product.id === productId &&
                (optionsString === undefined ||
                  (item.optionsString || "") === optionsString)
              )
          );
          return {
            items: newItems,
            shopId: newItems.length === 0 ? null : state.shopId,
          };
        }),

      updateQuantity: (
        productId: string,
        quantity: number,
        optionsString?: string
      ) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId &&
            (optionsString === undefined ||
              (item.optionsString || "") === optionsString)
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        })),

      clearCart: () => set({ items: [], shopId: null }),

      getCartTotal: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      getCartCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "jaay-cart-storage", // local storage key
    }
  )
);
