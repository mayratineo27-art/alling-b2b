import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// --- Interfaces de TypeScript estrictas ---

export interface OrderItem {
  sku: string;
  cantidad: number;
  precio_unitario: number;
  nombre?: string;
}

export interface OrderSummary {
  id: string;
  status: string;
  total_amount: number;
  payment_method?: string;
  created_at: Date | null;
  item_count: number;
}

export interface FormatoUnicoItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface FormatoUnicoActive {
  id: string;
  state: string;
  subtotal: number;
  updated_at: Date | null;
  items: FormatoUnicoItem[];
}

export interface DashboardData {
  formato_activo: FormatoUnicoActive | null;
  orders: OrderSummary[];
}

// --- Hook Principal ---

export const useDashboardData = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    // Seguridad: Si no hay autenticación, no ejecutamos la petición.
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // apiClient envía automáticamente cookies httpOnly gracias a withCredentials: true
      
      const [dashboardRes, ordersRes] = await Promise.allSettled([
        // Consumimos el endpoint central de dashboard que construimos en el backend
        apiClient.get("/dashboard/"),
        apiClient.get("orders/")
      ]);

      let formato_activo: FormatoUnicoActive | null = null;
      let orders: OrderSummary[] = [];

      // 401: la sesión expiró (access token de 60 min) o el refresh silencioso
      // del interceptor de apiClient ya falló. AuthContext/ProtectedRoute son
      // quienes deciden qué hacer con una sesión inválida (redirect a login);
      // este hook no debe mostrar un error "roto" por algo esperado.
      const esIgnorable = (reason: any) =>
        reason?.response?.status === 404 || reason?.response?.status === 401;

      if (dashboardRes.status === "fulfilled" && dashboardRes.value.data) {
        const rawFormato = dashboardRes.value.data.formato_activo;
        if (rawFormato) {
            formato_activo = {
            ...rawFormato,
            // Transformación de fechas ISO string a objetos Date nativos
            updated_at: rawFormato.updated_at ? new Date(rawFormato.updated_at) : null,
            };
        }
      } else if (dashboardRes.status === "rejected") {
        if (!esIgnorable(dashboardRes.reason)) {
          console.error("[Dashboard] fallo /dashboard/:", {
            status: dashboardRes.reason?.response?.status,
            data: dashboardRes.reason?.response?.data,
          });
          throw new Error("Error al obtener datos del dashboard");
        }
      }

      if (ordersRes.status === "fulfilled" && ordersRes.value.data) {
        orders = ordersRes.value.data.map((order: any) => ({
          ...order,
          created_at: order.created_at ? new Date(order.created_at) : null,
        }));
      } else if (ordersRes.status === "rejected") {
        if (!esIgnorable(ordersRes.reason)) {
          console.error("[Dashboard] fallo /orders/:", {
            status: ordersRes.reason?.response?.status,
            data: ordersRes.reason?.response?.data,
          });
          throw new Error("Error al cargar el historial de pedidos");
        }
      }

      setData({
        formato_activo,
        orders,
      });

    } catch (err: any) {
      console.error("Error en useDashboardData:", err);
      setError(err.message || "Ocurrió un error inesperado al cargar el Dashboard.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Solo disparamos el fetch si AuthContext ya terminó de inicializarse
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, fetchDashboardData]);

  return {
    dashboardData: data,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};
