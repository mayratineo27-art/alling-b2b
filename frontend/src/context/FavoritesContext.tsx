"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export interface FavoriteProduct {
  id: string;
  name: string;
  stock_display: string;
  price_public: number;
  category?: string;
  brand?: string;
  image_url?: string;
  slug?: string;
}

interface FavoritesContextType {
  favorites: string[];
  favoriteProducts: FavoriteProduct[];
  loading: boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  refresh: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isCustomer } = useAuth();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !isCustomer) {
      setFavorites([]);
      setFavoriteProducts([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get("/favoritos/");
      setFavorites(res.data.product_ids || []);
      setFavoriteProducts(res.data.products || []);
    } catch (err) {
      console.error("Error al cargar favoritos:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isCustomer]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleFavorite = useCallback(async (productId: string) => {
    if (!isAuthenticated) {
      showToast("Inicia sesión para guardar favoritos.", "warning");
      return;
    }
    if (!isCustomer) {
      showToast("Solo los clientes pueden guardar favoritos.", "warning");
      return;
    }

    const isFav = favorites.includes(productId);
    try {
      if (isFav) {
        await apiClient.delete(`/favoritos/${productId}`);
        setFavorites(prev => prev.filter(id => id !== productId));
        setFavoriteProducts(prev => prev.filter(p => p.id !== productId));
        showToast("Eliminado de favoritos.", "success");
      } else {
        await apiClient.post(`/favoritos/${productId}`);
        setFavorites(prev => [...prev, productId]);
        // Se recarga para traer el objeto completo del producto
        await refresh();
        showToast("Agregado a favoritos.", "success");
      }
    } catch (err) {
      console.error("Error al actualizar favoritos:", err);
      showToast("No se pudo actualizar favoritos.", "error");
    }
  }, [favorites, isAuthenticated, isCustomer, showToast, refresh]);

  const isFavorite = useCallback((productId: string) => {
    return favorites.includes(productId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, favoriteProducts, loading, toggleFavorite, isFavorite, refresh }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites debe usarse dentro de <FavoritesProvider>");
  return ctx;
}
