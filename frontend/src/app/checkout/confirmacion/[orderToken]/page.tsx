"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/errors";

interface OrderDetail {
  id: string;
  status: "PENDING_PAYMENT" | "PAID" | "READY_TO_SHIP" | "SHIPPED" | "CANCELLED";
  formato_unico_id: string;
  shipping_address?: string | null;
  total_amount: number;
  shipping_cost?: number | null;
  created_at?: string | null;
}

const ESTADO_LABEL: Record<OrderDetail["status"], { texto: string; color: string }> = {
  PENDING_PAYMENT: { texto: "Pago pendiente", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  PAID: { texto: "Pago confirmado", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  READY_TO_SHIP: { texto: "Listo para despacho", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  SHIPPED: { texto: "Enviado", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  CANCELLED: { texto: "Pago fallido / cancelado", color: "text-red-700 bg-red-50 border-red-200" },
};

// SCR-CHK-002 (RF-CHK-006, CMP-CHK-008/009): confirmación de pedido, accesible
// por GUEST vía orderToken o por CUSTOMER vía sesión.
export default function ConfirmacionPedidoPage() {
  const params = useParams<{ orderToken: string }>();
  const { isAuthenticated } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiClient.get(`/orders/by-token/${params.orderToken}`);
        setOrder(res.data);
        if (res.data.status === "CANCELLED") {
          window.location.href = `/checkout/error?order_token=${params.orderToken}`;
        }
      } catch (err: any) {
        setError(getErrorMessage(err, "No pudimos encontrar tu pedido."));
      } finally {
        setLoading(false);
      }
    };
    if (params.orderToken) cargar();
  }, [params.orderToken]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900">No encontramos tu pedido</h1>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <a href="/" className="mt-6 inline-block rounded-md bg-[#10B981] px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
          Volver al inicio
        </a>
      </main>
    );
  }

  const estado = ESTADO_LABEL[order.status];

  return (
    <main className="mx-auto max-w-lg px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <svg className="h-9 w-9 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl font-bold text-gray-900">¡Gracias por tu pedido!</h1>
      <p className="mt-2 text-sm text-gray-500">
        Pedido <span className="font-mono font-medium text-gray-700">#{order.id.slice(0, 8).toUpperCase()}</span>
      </p>

      <div className={`mt-4 inline-block rounded-full border px-4 py-1 text-sm font-medium ${estado.color}`}>
        {estado.texto}
      </div>

      <div className="mt-8 space-y-3 rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm">
        {order.shipping_address && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Dirección de envío</span>
            <span className="font-medium text-gray-900">{order.shipping_address}</span>
          </div>
        )}
        {order.shipping_cost != null && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Envío</span>
            <span className="font-medium text-gray-900">S/ {Number(order.shipping_cost).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-3 text-sm font-semibold">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">S/ {Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={() => window.print()}
          className="rounded-md border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Descargar comprobante
        </button>
        {isAuthenticated && (
          <a
            href="/dashboard"
            className="rounded-md bg-[#10B981] px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Ver mis pedidos
          </a>
        )}
      </div>
    </main>
  );
}
