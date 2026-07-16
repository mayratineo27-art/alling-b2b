"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

interface OrderDetail {
  id: string;
  status: string;
  cancellation_reason?: string | null;
}

// SCR-CHK-003 (RF-CHK-005/008, CMP-CHK-011/012): informa el fallo de pago y
// ofrece reintento (BTN-CHK-003 → OPS-FU-011 → FU vuelve a BORRADOR).
function CheckoutErrorContent() {
  const searchParams = useSearchParams();
  const orderToken = searchParams.get("order_token");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      if (!orderToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get(`/orders/by-token/${orderToken}`);
        setOrder(res.data);
      } catch {
        // Si no se encuentra, igual mostramos la pantalla de error genérica.
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [orderToken]);

  const handleReintentar = async () => {
    if (!order || !orderToken) return;
    setRetrying(true);
    setRetryError(null);
    try {
      await apiClient.post(`/orders/${order.id}/reintentar?order_token=${orderToken}`);
      // NAV-CHK-006: el FU vuelve a BORRADOR con los ítems preservados.
      window.location.href = "/formatos";
    } catch (err: any) {
      setRetryError(getErrorMessage(err, "No se pudo reintentar el pedido. Intenta de nuevo."));
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg className="h-9 w-9 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl font-bold text-gray-900">No pudimos procesar tu pago</h1>
      <p className="mt-2 text-sm text-gray-500">
        {order?.cancellation_reason || "El pago fue rechazado o cancelado. Puedes revisar tu lista antes de intentar de nuevo."}
      </p>

      {retryError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {retryError}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {order ? (
          <button
            onClick={handleReintentar}
            disabled={retrying}
            className="rounded-md bg-[#10B981] px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {retrying ? "Reintentando..." : "Reintentar pago"}
          </button>
        ) : (
          <a href="/formatos" className="rounded-md bg-[#10B981] px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
            Ver mi Formato Único
          </a>
        )}
        <a href="/productos" className="rounded-md border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Seguir comprando
        </a>
      </div>
    </main>
  );
}

export default function CheckoutErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-400 border-t-transparent" />
      </div>
    }>
      <CheckoutErrorContent />
    </Suspense>
  );
}
