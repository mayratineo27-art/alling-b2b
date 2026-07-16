"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, XCircle } from "lucide-react";
import apiClient from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { getFormatoBadge, getVigenciaCotizacion, formatDate } from "@/lib/formatoEstados";

export interface FormatoHistorialItem {
  id: string;
  state: string;
  subtotal: number;
  updated_at: string | null;
  items: { product_id: string }[];
  consultant_note?: string | null;
  pdf_url?: string | null;
}

interface FormatoCardProps {
  formato: FormatoHistorialItem;
  // RF-FU-020: se invoca con el FU ya en BORRADOR tras cancelar la cotización,
  // para que el listado padre lo reubique sin recargar toda la página.
  onCancelado?: (formato: FormatoHistorialItem) => void;
}

// Fila-tarjeta minimalista (estilo Stripe/Linear) para reemplazar la grilla
// tipo Excel en /cuenta/formatos, /cotizaciones y /consultas (RF-FU-010).
export function FormatoCard({ formato, onCancelado }: FormatoCardProps) {
  const badge = getFormatoBadge(formato.state);
  const vigencia = formato.state === "COTIZACION" ? getVigenciaCotizacion(formato.updated_at) : null;
  const itemsCount = formato.items.length;

  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancelar = async () => {
    setCancelando(true);
    setError(null);
    try {
      const res = await apiClient.post(`/formatos/${formato.id}/cancelar-cotizacion`);
      setConfirmando(false);
      onCancelado?.(res.data);
    } catch (err: any) {
      setError(getErrorMessage(err, "No se pudo cancelar la cotización."));
    } finally {
      setCancelando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-gray-200 hover:shadow-md sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-gray-900">
            #{formato.id.slice(0, 8).toUpperCase()}
          </span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
          {formato.state === "RESUELTA" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Respuesta lista
            </span>
          )}
          {vigencia && (
            <span className={`text-xs font-medium ${vigencia.expirada ? "text-red-500" : "text-amber-600"}`}>
              {vigencia.expirada ? "Vigencia vencida" : `Vence en ${vigencia.diasRestantes} día${vigencia.diasRestantes === 1 ? "" : "s"}`}
            </span>
          )}
        </div>

        <p className="mt-1.5 text-xs text-gray-400">
          {formatDate(formato.updated_at)} · {itemsCount} ítem{itemsCount === 1 ? "" : "s"}
        </p>

        {formato.state === "RESUELTA" && formato.consultant_note && (
          <div className="mt-3 line-clamp-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-800">
            <span className="font-medium">Respuesta del asesor: </span>
            {formato.consultant_note}
          </div>
        )}

        {confirmando && (
          <div className="mt-3 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2.5 text-sm text-red-700">
            <p>¿Cancelar esta cotización? Perderás el precio congelado; el Formato Único vuelve a Borrador con los mismos ítems.</p>
            {error && <p className="mt-1 font-medium">{error}</p>}
            <div className="mt-2 flex gap-3">
              <button
                onClick={handleCancelar}
                disabled={cancelando}
                className="font-semibold text-red-700 hover:underline disabled:opacity-60"
              >
                {cancelando ? "Cancelando..." : "Sí, cancelar"}
              </button>
              <button
                onClick={() => { setConfirmando(false); setError(null); }}
                disabled={cancelando}
                className="text-gray-500 hover:underline disabled:opacity-60"
              >
                No, mantener
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <span className="text-lg font-bold text-gray-900">S/ {Number(formato.subtotal).toFixed(2)}</span>
        <div className="flex items-center gap-3">
          {formato.state === "COTIZACION" && !confirmando && (
            <button
              onClick={() => setConfirmando(true)}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-red-600 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancelar
            </button>
          )}
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
          <Link
            href={`/cuenta/formatos/${formato.id}`}
            className="text-sm font-medium text-[#10B981] hover:underline"
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
}
