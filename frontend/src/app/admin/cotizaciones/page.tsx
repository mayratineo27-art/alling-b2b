"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import apiClient from "@/lib/api";

interface Cotizacion {
  id: string;
  state: string;
  customer_id?: string;
  subtotal?: number;
  discount_percent?: number;
  has_pdf: boolean;
  updated_at?: string;
}

const STATE_LABELS: Record<string, string> = {
  COTIZACION: "Vigente",
  EXPIRADA:   "Expirada",
  PEDIDO:     "Convertida",
  CONFIRMADO: "Confirmada",
};
const STATE_COLORS: Record<string, string> = {
  COTIZACION: "bg-blue-100 text-blue-700",
  EXPIRADA:   "bg-red-100 text-red-600",
  PEDIDO:     "bg-amber-100 text-amber-700",
  CONFIRMADO: "bg-green-100 text-green-700",
};
const FILTERS = [
  { key: "", label: "Todas" },
  { key: "COTIZACION", label: "Vigentes" },
  { key: "EXPIRADA", label: "Expiradas" },
  { key: "PEDIDO", label: "Convertidas" },
] as const;

export default function AdminCotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchCotizaciones = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `/cotizaciones?estado=${filter}` : "/cotizaciones";
      const res = await apiClient.get(url);
      setCotizaciones(res.data);
    } catch {
      setCotizaciones([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchCotizaciones(); }, [fetchCotizaciones]);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-[var(--alling-text)]">Pipeline de Cotizaciones (Gobernanza)</h1>
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === key
                      ? "bg-[var(--alling-primary)] text-white"
                      : "bg-white border border-[var(--alling-border)] text-[var(--alling-text)] hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="text-[var(--alling-metadata)]">Cargando cotizaciones...</p>}

          {!loading && (
            <div className="bg-white rounded-md border border-[var(--alling-border)] overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-[var(--alling-border)]">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-[var(--alling-text)]">ID</th>
                    <th className="text-right px-4 py-3 font-medium text-[var(--alling-text)]">Subtotal</th>
                    <th className="text-center px-4 py-3 font-medium text-[var(--alling-text)]">Descuento</th>
                    <th className="text-center px-4 py-3 font-medium text-[var(--alling-text)]">Estado</th>
                    <th className="text-center px-4 py-3 font-medium text-[var(--alling-text)]">Actualizado</th>
                    <th className="text-center px-4 py-3 font-medium text-[var(--alling-text)]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--alling-border)]">
                  {cotizaciones.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--alling-metadata)]">Sin cotizaciones en esta vista</td></tr>
                  )}
                  {cotizaciones.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--alling-text)]">#{c.id.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-right text-[var(--alling-text)] font-medium">
                        {c.subtotal != null ? `S/ ${c.subtotal.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-[var(--alling-text)]">
                        {c.discount_percent != null ? `${c.discount_percent}%` : "0%"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATE_COLORS[c.state] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATE_LABELS[c.state] ?? c.state}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-[var(--alling-metadata)]">
                        {c.updated_at ? new Date(c.updated_at).toLocaleDateString("es-PE") : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link href={`/admin/cotizaciones/${c.id}`}
                          className="text-xs text-[var(--alling-primary)] hover:underline">
                          Ver detalle / Aplicar Descuento
                        </Link>
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
