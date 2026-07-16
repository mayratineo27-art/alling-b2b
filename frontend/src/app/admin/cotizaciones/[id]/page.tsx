"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface CotizacionDetail {
  id: string;
  state: string;
  customer_id?: string;
  subtotal?: number;
  pdf_url?: string;
  discount_percent?: number;
  updated_at?: string;
}

const STATE_LABELS: Record<string, string> = {
  COTIZACION: "Vigente", EXPIRADA: "Expirada", PEDIDO: "Convertida a pedido", CONFIRMADO: "Confirmada",
};

export default function AdminCotizacionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const fuId = params?.id ?? "";
  const { user } = useAuth();

  const [cotizacion, setCotizacion] = useState<CotizacionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discountVal, setDiscountVal] = useState("");
  const [updatingDiscount, setUpdatingDiscount] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCotizacion = useCallback(() => {
    setLoading(true);
    apiClient.get(`/cotizaciones/${fuId}`)
      .then((res) => {
        setCotizacion(res.data);
        if (res.data.discount_percent != null) {
          setDiscountVal(res.data.discount_percent.toString());
        }
      })
      .catch(() => setError("Cotización no encontrada"))
      .finally(() => setLoading(false));
  }, [fuId]);

  useEffect(() => {
    fetchCotizacion();
  }, [fetchCotizacion]);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(discountVal);
    if (isNaN(val) || val < 0 || val > 30.0) {
      showToast("Descuento inválido. Debe estar entre 0% y 30% (RN-ADM-04)");
      return;
    }
    setUpdatingDiscount(true);
    try {
      await apiClient.post(`/admin/cotizaciones/${fuId}/descuento`, {
        discount_percent: val,
      });
      showToast("Descuento B2B manual de administrador aplicado con éxito");
      fetchCotizacion();
    } catch (err: any) {
      showToast(err.response?.data?.detail ?? "Error al aplicar descuento");
    } finally {
      setUpdatingDiscount(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <button onClick={() => router.push("/admin/cotizaciones")} className="text-sm text-[var(--alling-metadata)] hover:text-[var(--alling-text)] mb-2">
              ← Volver a cotizaciones
            </button>
            <h1 className="text-2xl font-bold text-[var(--alling-text)]">Detalle de Cotización</h1>
            <p className="text-sm font-mono text-[var(--alling-metadata)]">#{fuId.slice(0, 16)}</p>
          </div>

          {toast && <div className="bg-[var(--alling-primary)] text-white px-4 py-2 rounded-md text-sm mb-2">{toast}</div>}
          {loading && <p className="text-[var(--alling-metadata)]">Cargando...</p>}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">{error}</div>
          )}

          {!loading && cotizacion && (
            <div className="space-y-4">
              <div className="bg-white rounded-md border border-[var(--alling-border)] p-6 shadow-sm">
                <h2 className="text-base font-semibold text-[var(--alling-text)] mb-4">Información</h2>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-[var(--alling-metadata)]">Estado</dt>
                    <dd className="font-semibold text-[var(--alling-text)] mt-0.5">
                      {STATE_LABELS[cotizacion.state] ?? cotizacion.state}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--alling-metadata)]">Subtotal con descuento B2B</dt>
                    <dd className="font-bold text-[var(--alling-primary)] text-lg mt-0.5">
                      {cotizacion.subtotal != null ? `S/ ${cotizacion.subtotal.toFixed(2)}` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--alling-metadata)]">Cliente ID</dt>
                    <dd className="font-mono text-xs text-[var(--alling-text)] mt-0.5">
                      {cotizacion.customer_id ? cotizacion.customer_id.slice(0, 16) + "…" : "GUEST"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--alling-metadata)]">Porcentaje de Descuento</dt>
                    <dd className="font-medium text-[var(--alling-text)] mt-0.5">
                      {cotizacion.discount_percent != null ? `${cotizacion.discount_percent}%` : "0%"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--alling-metadata)]">Última actualización</dt>
                    <dd className="text-[var(--alling-text)] mt-0.5">
                      {cotizacion.updated_at ? new Date(cotizacion.updated_at).toLocaleString("es-PE") : "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* ADMIN manual discount action */}
              {cotizacion.state === "COTIZACION" && (
                <form onSubmit={handleApplyDiscount} className="bg-white rounded-md border border-[var(--alling-border)] p-6 shadow-sm space-y-4">
                  <h2 className="text-base font-semibold text-[var(--alling-text)]">Gobernanza B2B: Descuento Comercial</h2>
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded text-xs">
                    💡 Como Administrador, puedes aplicar un descuento de hasta el 30% (RN-ADM-04) a esta cotización. El subtotal se recalculará automáticamente y se congelará.
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-[var(--alling-text)] mb-1">
                        Porcentaje de descuento (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="30"
                        value={discountVal}
                        onChange={(e) => setDiscountVal(e.target.value)}
                        placeholder="Ej. 10"
                        className="w-full border border-[var(--alling-border)] rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--alling-primary)]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={updatingDiscount}
                      className="bg-[var(--alling-primary)] text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-[var(--alling-primary-hover)] disabled:opacity-50 transition-colors mt-5"
                    >
                      {updatingDiscount ? "Aplicando..." : "Aplicar Descuento"}
                    </button>
                  </div>
                </form>
              )}

              {/* PDF section */}
              <div className="bg-white rounded-md border border-[var(--alling-border)] p-6 shadow-sm">
                <h2 className="text-base font-semibold text-[var(--alling-text)] mb-3">Documento PDF</h2>
                {cotizacion.pdf_url ? (
                  <a
                    href={`/api/cotizaciones/${fuId}/pdf`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[var(--alling-text)] text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-80 transition-opacity"
                  >
                    📄 Descargar PDF
                  </a>
                ) : (
                  <p className="text-sm text-[var(--alling-metadata)]">
                    PDF no disponible aún para esta cotización.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
