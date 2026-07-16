"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import apiClient from "@/lib/api";

interface Metrics {
  revenue_total: number;
  orders_count: number;
  paid_orders_count: number;
  top_products: { name: string; count: number }[];
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-md border border-[var(--alling-border)] p-6 shadow-sm">
      <p className="text-sm text-[var(--alling-metadata)] mb-1">{label}</p>
      <p className="text-3xl font-bold text-[var(--alling-text)]">{value}</p>
    </div>
  );
}

export default function AdminMetricasPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get("/admin/metricas/ventas")
      .then((res) => setMetrics(res.data))
      .catch(() => setError("No se pudieron cargar las métricas"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-[var(--alling-text)]">Métricas de Ventas</h1>

          {loading && <p className="text-[var(--alling-metadata)]">Cargando métricas...</p>}
          {error && <p className="text-[var(--alling-danger)]">{error}</p>}

          {metrics && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Revenue Total" value={`S/ ${metrics.revenue_total.toFixed(2)}`} />
                <StatCard label="Total Pedidos" value={String(metrics.orders_count)} />
                <StatCard label="Pedidos Pagados" value={String(metrics.paid_orders_count)} />
              </div>

              <div className="bg-white rounded-md border border-[var(--alling-border)] p-6 shadow-sm">
                <h2 className="text-base font-semibold text-[var(--alling-text)] mb-4">
                  Productos más vendidos
                </h2>
                {metrics.top_products.length === 0 ? (
                  <p className="text-sm text-[var(--alling-metadata)]">
                    Sin datos suficientes aún. Los datos se mostrarán cuando haya pedidos confirmados.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {metrics.top_products.map((p, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-[var(--alling-text)]">{p.name}</span>
                        <span className="text-[var(--alling-metadata)]">{p.count} uds.</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
