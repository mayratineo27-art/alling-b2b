"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import apiClient from "@/lib/api";

export interface CartItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name?: string | null;
  sku?: string | null;
  stock_disponible?: number | null;
  kit_id?: string | null;
  kit_name?: string | null;
}

export interface CartData {
  id: string;
  state: string;
  items: CartItem[];
  subtotal: number;
}

interface CartContextType {
  cart: CartData | null;
  loading: boolean;
  count: number;
  refresh: () => Promise<void>;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// T6-F2: useCart.ts (addToCart) no expone conteo/subtotal global — cada
// componente refetcheaba /formatos/me por su cuenta. Este contexto
// centraliza el estado del Formato Único BORRADOR activo para que el
// CartBadge (Header) y el CartDrawer reaccionen a los mismos datos.
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await apiClient.get("/formatos/me");
      setCart(res.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        count,
        refresh,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext debe usarse dentro de <CartProvider>");
  return ctx;
}
