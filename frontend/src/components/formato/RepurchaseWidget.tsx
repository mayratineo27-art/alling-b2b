"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { useToast } from "@/context/ToastContext";
import { getFormatoBadge, formatDate } from "@/lib/formatoEstados";

interface HistorialItem {
  id: string;
  state: string;
  subtotal: number;
  updated_at: string | null;
  items: { product_id: string }[];
}

const ESTADOS_CERRADOS = ["COTIZACION", "EXPIRADA", "CANCELADO", "RECHAZADO", "CONFIRMADO", "PEDIDO", "RESUELTA"];

interface RepurchaseWidgetProps {
  onBorradorActualizado: () => void;
}

// T6-F6 (Widget de Recompra) — notas_actualizacion_diseno.md §1.C: para
// CUSTOMER con hasHistory=true, lista las últimas 3 cotizaciones cerradas
// con las dos acciones de carga (Reemplazar / Combinar), BTN-FU-008a/b.
export function RepurchaseWidget({ onBorradorActualizado }: RepurchaseWidgetProps) {
  const { showToast } = useToast();
  const [historial, setHistorial] = useState<HistorialItem[] | null>(null);
  const [confirmandoReemplazo, setConfirmandoReemplazo] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiClient.get("/formatos/historial/?skip=0&limit=100");
        const cerrados = (res.data as HistorialItem[])
          .filter((f) => ESTADOS_CERRADOS.includes(f.state))
          .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""))
          .slice(0, 3);
        setHistorial(cerrados);
      } catch {
        setHistorial([]);
      }
    };
    cargar();
  }, []);

  const handleReemplazar = async (historicoId: string) => {
    setProcesando(historicoId);
    setError(null);
    try {
      await apiClient.post(`/formatos/${historicoId}/reemplazar-borrador`);
      setConfirmandoReemplazo(null);
      onBorradorActualizado();
      showToast("Tu borrador fue reemplazado con los productos de esa cotización.");
    } catch (err: any) {
      setError(getErrorMessage(err, "No se pudo reemplazar el borrador."));
    } finally {
      setProcesando(null);
    }
  };

  const handleCombinar = async (historicoId: string) => {
    setProcesando(historicoId);
    setError(null);
    try {
      const res = await apiClient.post(`/formatos/${historicoId}/combinar-borrador`);
      onBorradorActualizado();
      const cantidad = res.data.items?.length ?? 0;
      showToast(`Se combinaron los productos al borrador actual (${cantidad} ítems en total).`);
    } catch (err: any) {
      showToast(getErrorMessage(err, "No se pudo combinar con el borrador."));
    } finally {
      setProcesando(null);
    }
  };

  if (historial === null) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  if (historial.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-gray-900">Recompra rápida</h2>
      <p className="mt-1 text-xs text-gray-500">Tus últimas cotizaciones cerradas.</p>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      <ul className="mt-4 space-y-3">
        {historial.map((f) => {
          const badge = getFormatoBadge(f.state);
          const enProceso = procesando === f.id;
          return (
            <li key={f.id} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-gray-900">
                  #{f.id.slice(0, 8).toUpperCase()}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {formatDate(f.updated_at)} · {f.items.length} ítem{f.items.length === 1 ? "" : "s"} · S/ {Number(f.subtotal).toFixed(2)}
              </p>

              {confirmandoReemplazo === f.id ? (
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                  <p>¿Reemplazar tu borrador actual? Los productos que tienes seleccionados ahora se perderán.</p>
                  <div className="mt-2 flex gap-3">
                    <button
                      onClick={() => handleReemplazar(f.id)}
                      disabled={enProceso}
                      className="font-semibold text-amber-800 hover:underline disabled:opacity-60"
                    >
                      {enProceso ? "Reemplazando..." : "Sí, reemplazar"}
                    </button>
                    <button onClick={() => setConfirmandoReemplazo(null)} className="text-gray-500 hover:underline">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex gap-3">
                  <button
                    onClick={() => setConfirmandoReemplazo(f.id)}
                    className="text-xs font-semibold text-gray-600 hover:text-red-600"
                  >
                    Reemplazar Borrador
                  </button>
                  <button
                    onClick={() => handleCombinar(f.id)}
                    disabled={enProceso}
                    className="text-xs font-semibold text-[#10B981] hover:underline disabled:opacity-60"
                  >
                    {enProceso ? "Combinando..." : "Combinar con Borrador"}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
