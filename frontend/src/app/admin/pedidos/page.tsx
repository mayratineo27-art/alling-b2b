"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import apiClient from "@/lib/api";

interface Order {
  id: string;
  status: string;
  formato_unico_id: string;
  total_amount: number;
  shipping_address?: string;
  created_at?: string;
}

const STATUS_LABELS: Record<string, string> = {
  READY_TO_SHIP: "Listo para despacho",
  SHIPPED:       "Despachado",
  PAID:          "Pagado",
  PENDING_PAYMENT: "Pago pendiente",
  CANCELLED:     "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  READY_TO_SHIP: "bg-amber-100 text-amber-700",
  SHIPPED:       "bg-green-100 text-green-700",
  PAID:          "bg-blue-100 text-blue-700",
  PENDING_PAYMENT: "bg-gray-100 text-gray-600",
  CANCELLED:     "bg-red-100 text-red-600",
};

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"READY_TO_SHIP" | "SHIPPED">("READY_TO_SHIP");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/seller/pedidos?estado=${filter}`);
      setOrders(res.data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-[var(--alling-text)]">Cola de Pedidos (Administración)</h1>
            <div className="flex gap-2">
              {(["READY_TO_SHIP", "SHIPPED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === s
                      ? "bg-[var(--alling-primary)] text-white"
                      : "bg-white border border-[var(--alling-border)] text-[var(--alling-text)] hover:bg-gray-50"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="text-[var(--alling-metadata)]">Cargando pedidos...</p>}

          {!loading && (
            <div className="bg-white rounded-md border border-[var(--alling-border)] overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-[var(--alling-border)]">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-[var(--alling-text)]">Pedido</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--alling-text)]">Dirección</th>
                    <th className="text-right px-4 py-3 font-medium text-[var(--alling-text)]">Total</th>
                    <th className="text-center px-4 py-3 font-medium text-[var(--alling-text)]">Estado</th>
                    <th className="text-center px-4 py-3 font-medium text-[var(--alling-text)]">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--alling-border)]">
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[var(--alling-metadata)]">
                        {filter === "READY_TO_SHIP" ? "No hay pedidos pendientes de despacho 🎉" : "Sin historial de despachos"}
                      </td>
                    </tr>
                  )}
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--alling-text)]">
                        #{o.id.slice(0, 8)}
                        <br />
                        <span className="text-[var(--alling-metadata)]">
                          {o.created_at ? new Date(o.created_at).toLocaleDateString("es-PE") : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--alling-metadata)] max-w-xs truncate">
                        {o.shipping_address ?? "Sin dirección"}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--alling-text)] font-medium">
                        S/ {o.total_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {o.status === "READY_TO_SHIP" && (
                          <Link
                            href={`/admin/pedidos/${o.id}/guia`}
                            className="text-xs bg-[var(--alling-primary)] text-white px-3 py-1 rounded hover:bg-[var(--alling-primary-hover)] transition-colors"
                          >
                            Generar guía
                          </Link>
                        )}
                        {o.status === "SHIPPED" && (
                          <span className="text-xs text-[var(--alling-metadata)]">Despachado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
