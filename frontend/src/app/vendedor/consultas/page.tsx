"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import SellerLayout from "@/components/seller/SellerLayout";
import apiClient from "@/lib/api";

interface Consulta {
  id: string;
  state: string;
  customer_id?: string;
  assigned_seller_id?: string;
  consultant_note?: string;
  updated_at?: string;
}

export default function SellerConsultasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "mine" | "unassigned">("all");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchConsultas = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/consultas";
      if (filter === "mine") url += "?assigned_to_me=true";
      if (filter === "unassigned") url += "?assigned_to_me=false";
      const res = await apiClient.get(url);
      setConsultas(res.data);
    } catch {
      setConsultas([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchConsultas(); }, [fetchConsultas]);

  const handleTomar = async (fuId: string) => {
    try {
      await apiClient.post(`/consultas/${fuId}/tomar`);
      showToast("Consulta asignada. Ahora puedes responderla.");
      fetchConsultas();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al tomar la consulta");
    }
  };

  const FILTER_LABELS = { all: "Todas", mine: "Mis consultas", unassigned: "Sin asignar" } as const;

  return (
    <ProtectedRoute requiredRole="SELLER">
      <SellerLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-[var(--alling-text)]">Consultas Pre-Venta</h1>
            <div className="flex gap-2">
              {(["all", "mine", "unassigned"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === f
                      ? "bg-[var(--alling-primary)] text-white"
                      : "bg-white border border-[var(--alling-border)] text-[var(--alling-text)] hover:bg-gray-50"
                  }`}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {toast && <div className="bg-[var(--alling-primary)] text-white px-4 py-2 rounded-md text-sm">{toast}</div>}
          {loading && <p className="text-[var(--alling-metadata)]">Cargando consultas...</p>}

          {!loading && (
            <div className="space-y-3">
              {consultas.length === 0 && (
                <div className="bg-white rounded-md border border-[var(--alling-border)] p-8 text-center text-[var(--alling-metadata)]">
                  No hay consultas en esta vista.
                </div>
              )}
              {consultas.map((c) => (
                <div key={c.id} className="bg-white rounded-md border border-[var(--alling-border)] p-4 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-[var(--alling-text)] truncate">#{c.id.slice(0, 12)}</p>
                    <p className="text-xs text-[var(--alling-metadata)] mt-0.5">
                      {c.updated_at ? new Date(c.updated_at).toLocaleString("es-PE") : "—"}
                    </p>
                    {c.assigned_seller_id ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1 inline-block">Asignada</span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded mt-1 inline-block">Sin asignar</span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!c.assigned_seller_id && (
                      <button onClick={() => handleTomar(c.id)}
                        className="text-xs bg-[var(--alling-primary)] text-white px-3 py-1.5 rounded hover:bg-[var(--alling-primary-hover)] transition-colors">
                        Atender
                      </button>
                    )}
                    <Link href={`/vendedor/consultas/${c.id}`}
                      className="text-xs border border-[var(--alling-border)] text-[var(--alling-text)] px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
                      Ver detalle
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SellerLayout>
    </ProtectedRoute>
  );
}
