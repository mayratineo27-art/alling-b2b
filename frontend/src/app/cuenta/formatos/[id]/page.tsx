"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Download, XCircle } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { getFormatoBadge, getVigenciaCotizacion, parseUtcDate } from "@/lib/formatoEstados";

interface FormatoItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name?: string | null;
  sku?: string | null;
}

interface FormatoDetalle {
  id: string;
  state: string;
  subtotal: number;
  updated_at: string | null;
  items: FormatoItem[];
  consultant_note?: string | null;
  pdf_url?: string | null;
}

// BTN-FU-011 "Ver detalle" (fila historial) → NAV-FU-003, destino de SCR-FU-002.
function DetalleFormatoContent() {
  const params = useParams<{ id: string }>();
  const [formato, setFormato] = useState<FormatoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiClient.get(`/formatos/${params.id}`);
        setFormato(res.data);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError("No tienes permiso para ver este Formato Único.");
        } else if (err.response?.status === 404) {
          setError("Formato Único no encontrado.");
        } else {
          setError(getErrorMessage(err, "No se pudo cargar el detalle."));
        }
      } finally {
        setLoading(false);
      }
    };
    if (params.id) cargar();
  }, [params.id]);

  // RF-FU-020 / FU-T-15: cancelación voluntaria de la cotización vigente.
  const handleCancelarCotizacion = async () => {
    if (!formato) return;
    setCancelando(true);
    setCancelError(null);
    try {
      const res = await apiClient.post(`/formatos/${formato.id}/cancelar-cotizacion`);
      setFormato(res.data);
      setConfirmandoCancelar(false);
    } catch (err: any) {
      setCancelError(getErrorMessage(err, "No se pudo cancelar la cotización."));
    } finally {
      setCancelando(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return parseUtcDate(iso).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Link href="/cuenta/formatos" className="text-sm font-medium text-[#10B981] hover:underline">
        ← Volver a mis Formatos Únicos
      </Link>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent" />
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && formato && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Formato #{formato.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="mt-1 text-sm text-gray-500">Última actualización: {formatDate(formato.updated_at)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const badge = getFormatoBadge(formato.state);
                return (
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                );
              })()}
              {formato.state === "RESUELTA" && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Respuesta lista
                </span>
              )}
              {formato.state === "COTIZACION" &&
                (() => {
                  const vigencia = getVigenciaCotizacion(formato.updated_at);
                  if (!vigencia) return null;
                  return (
                    <span className={`text-xs font-medium ${vigencia.expirada ? "text-red-500" : "text-amber-600"}`}>
                      {vigencia.expirada ? "Vigencia vencida" : `Vence en ${vigencia.diasRestantes} día${vigencia.diasRestantes === 1 ? "" : "s"}`}
                    </span>
                  );
                })()}
              {formato.pdf_url && (
                <a
                  href={formato.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#10B981] transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </a>
              )}
              {formato.state === "COTIZACION" && !confirmandoCancelar && (
                <button
                  onClick={() => setConfirmandoCancelar(true)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-red-600 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancelar cotización
                </button>
              )}
            </div>
          </div>

          {formato.state === "RESUELTA" && formato.consultant_note && (
            <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
              <span className="font-medium">Respuesta del asesor: </span>
              {formato.consultant_note}
            </div>
          )}

          {confirmandoCancelar && (
            <div className="mt-5 rounded-lg border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-700">
              <p>¿Cancelar esta cotización? Perderás el precio congelado; el Formato Único vuelve a Borrador con los mismos ítems.</p>
              {cancelError && <p className="mt-1 font-medium">{cancelError}</p>}
              <div className="mt-2 flex gap-4">
                <button
                  onClick={handleCancelarCotizacion}
                  disabled={cancelando}
                  className="font-semibold text-red-700 hover:underline disabled:opacity-60"
                >
                  {cancelando ? "Cancelando..." : "Sí, cancelar"}
                </button>
                <button
                  onClick={() => { setConfirmandoCancelar(false); setCancelError(null); }}
                  disabled={cancelando}
                  className="text-gray-500 hover:underline disabled:opacity-60"
                >
                  No, mantener
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Producto</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3 text-right">Cantidad</th>
                  <th className="px-6 py-3 text-right">Precio unit.</th>
                  <th className="px-6 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {formato.items.map((item) => (
                  <tr key={item.product_id}>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.product_name || item.sku || item.product_id}</td>
                    <td className="px-6 py-4 text-gray-500">{item.sku || "N/A"}</td>
                    <td className="px-6 py-4 text-right">{item.quantity}</td>
                    <td className="px-6 py-4 text-right">S/ {Number(item.unit_price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">S/ {Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-900">Subtotal</span>
                <span className="text-lg font-bold text-gray-900">S/ {Number(formato.subtotal).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DetalleFormatoPage() {
  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <DashboardLayout>
        <DetalleFormatoContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
