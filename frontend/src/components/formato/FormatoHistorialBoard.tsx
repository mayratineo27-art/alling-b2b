"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import apiClient from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { FormatoCard, type FormatoHistorialItem } from "./FormatoCard";

export type FormatoTab = "todos" | "borradores" | "cotizaciones" | "consultas";

const TABS: { id: FormatoTab; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "borradores", label: "Borradores" },
  { id: "cotizaciones", label: "Cotizaciones" },
  { id: "consultas", label: "Consultas" },
];

// RF-FU-010: solo estados pre-venta/planificación. Los estados
// transaccionales (PEDIDO, CONFIRMADO, CANCELADO, RECHAZADO) pertenecen a
// /pedidos (RF-FU-012) y quedan fuera de este tablero.
const TAB_STATES: Record<FormatoTab, string[]> = {
  todos: ["BORRADOR", "COTIZACION", "CONSULTA", "RESUELTA", "EXPIRADA"],
  borradores: ["BORRADOR"],
  cotizaciones: ["COTIZACION", "EXPIRADA"],
  consultas: ["CONSULTA", "RESUELTA"],
};

const PAGE_SIZE = 10;

interface FormatoHistorialBoardProps {
  title: string;
  subtitle: string;
  initialTab: FormatoTab;
}

export function FormatoHistorialBoard({ title, subtitle, initialTab }: FormatoHistorialBoardProps) {
  const [formatos, setFormatos] = useState<FormatoHistorialItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FormatoTab>(initialTab);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiClient.get("/formatos/historial/?skip=0&limit=100");
        setFormatos(res.data);
      } catch (err: any) {
        setError(getErrorMessage(err, "No se pudo cargar tu historial."));
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const filtrados = useMemo(() => {
    if (!formatos) return [];
    const estadosVisibles = TAB_STATES.todos;
    const estadosTab = TAB_STATES[activeTab];
    return formatos
      .filter((f) => estadosVisibles.includes(f.state))
      .filter((f) => estadosTab.includes(f.state));
  }, [formatos, activeTab]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaSegura - 1) * PAGE_SIZE, paginaSegura * PAGE_SIZE);

  const cambiarTab = (tab: FormatoTab) => {
    setActiveTab(tab);
    setPagina(1);
  };

  const handleCancelado = (actualizado: FormatoHistorialItem) => {
    setFormatos((prev) => prev?.map((f) => (f.id === actualizado.id ? actualizado : f)) ?? prev);
  };

  return (
    <>
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>
      </div>

      {/* Pestañas simplificadas (estilo Stripe/Linear) — reemplazan la fila de 10 píldoras de estado */}
      <div className="mt-6 flex items-center gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => cambiarTab(tab.id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-[#10B981] text-[#10B981]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
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

        {!loading && !error && filtrados.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-12 text-center">
            <Inbox className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              {activeTab === "todos"
                ? "No tienes ningún Formato Único todavía."
                : `No tienes elementos en "${TABS.find((t) => t.id === activeTab)?.label}".`}
            </p>
            <Link href="/productos" className="text-sm font-medium text-[#10B981] hover:underline">
              Ir al catálogo →
            </Link>
          </div>
        )}

        {!loading && !error && visibles.map((f) => (
          <FormatoCard key={f.id} formato={f} onCancelado={handleCancelado} />
        ))}

        {!loading && !error && totalPaginas > 1 && (
          <div className="flex items-center justify-between pt-2 text-sm text-gray-500">
            <span>
              Página {paginaSegura} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaSegura === 1}
                className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaSegura === totalPaginas}
                className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
