"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Truck } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { getOrderBadge, parseUtcDate } from "@/lib/formatoEstados";

interface OrderSummary {
  id: string;
  status: "PENDING_PAYMENT" | "PAID" | "READY_TO_SHIP" | "SHIPPED" | "CANCELLED";
  total_amount: number;
  shipping_cost: number | null;
  payment_method: string | null;
  order_token: string | null;
  created_at: string | null;
  formato_unico_id: string;
}

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return parseUtcDate(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// RF-FU-012 / UC-FU-008: historial post-venta (Order asociada a un FU que
// transicionó a PEDIDO/CONFIRMADO). Vista separada de /cotizaciones y
// /consultas (RF-FU-010) para no mezclar planificación con transacciones.
function HistorialPedidosContent() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiClient.get("/orders/");
        setOrders(res.data);
      } catch (err: any) {
        setError(getErrorMessage(err, "No se pudo cargar tu historial de pedidos."));
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  return (
    <>
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Historial de Pedidos</h1>
        <p className="mt-1.5 text-sm text-gray-500">Seguimiento de pago, envío Shalom y comprobantes de tus compras.</p>
      </div>

      <div className="mt-6 space-y-3">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && orders?.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-12 text-center">
            <Inbox className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">No tienes pedidos recientes.</p>
            <Link href="/productos" className="text-sm font-medium text-[#10B981] hover:underline">
              Ir al catálogo →
            </Link>
          </div>
        )}

        {!loading &&
          !error &&
          orders?.map((order) => {
            const badge = getOrderBadge(order.status);
            return (
              <div
                key={order.id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-gray-200 hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                    {formatDate(order.created_at)}
                    {order.shipping_cost != null && (
                      <>
                        <Truck className="h-3.5 w-3.5" />
                        Envío Shalom: S/ {Number(order.shipping_cost).toFixed(2)}
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="text-lg font-bold text-gray-900">S/ {Number(order.total_amount).toFixed(2)}</span>
                  {order.order_token && (
                    <Link
                      href={`/checkout/confirmacion/${order.order_token}`}
                      className="text-sm font-medium text-[#10B981] hover:underline"
                    >
                      Ver detalle
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}

export default function PedidosPage() {
  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <DashboardLayout>
        <HistorialPedidosContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
