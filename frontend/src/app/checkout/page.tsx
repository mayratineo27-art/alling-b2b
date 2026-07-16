"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/errors";

interface FormatoItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name?: string | null;
  sku?: string | null;
}

interface FormatoActivo {
  id: string;
  state: string;
  items: FormatoItem[];
  subtotal: number;
}

// SCR-CHK-001 (RF-CHK-001/002/003): captura datos de envío/facturación,
// muestra el resumen del pedido e inicia el pago con MercadoPago.
export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [formato, setFormato] = useState<FormatoActivo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [address, setAddress] = useState("");
  const [billingId, setBillingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const cargarDatos = async () => {
      try {
        const fuRes = await apiClient.get("/formatos/me");
        setFormato(fuRes.data);

        if (isAuthenticated) {
          try {
            const facturacionRes = await apiClient.get("/usuarios/me/facturacion");
            setAddress(facturacionRes.data.address || "");
            setBillingId(facturacionRes.data.document_number || "");
          } catch {
            // Auto-completado es una mejora opcional (RF-CHK-009); si falla, el
            // usuario simplemente completa el formulario manualmente.
          }
        }
      } catch (err: any) {
        setLoadError(getErrorMessage(err, "No se pudo cargar tu Formato Único activo."));
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [authLoading, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formato) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await apiClient.post("/checkout", {
        fu_id: formato.id,
        billing_id: billingId,
        address,
      });
      // BTN-CHK-001 / NAV-CHK-002: entrega el control a MercadoPago.
      window.location.href = res.data.payment_url;
    } catch (err: any) {
      setSubmitError(getErrorMessage(err, "No se pudo iniciar el pago. Intenta de nuevo."));
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  if (loadError || !formato) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900">No hay nada que pagar todavía</h1>
        <p className="mt-2 text-gray-500">{loadError || "No tienes un Formato Único activo."}</p>
        <a href="/productos" className="mt-6 inline-block rounded-md bg-[#10B981] px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
          Ir al catálogo
        </a>
      </main>
    );
  }

  {/* FU-T-04 (BORRADOR→PEDIDO, compra directa) y FU-T-09 (COTIZACION→PEDIDO)
      son ambos caminos válidos hacia checkout (OPS-FU-006). */}
  if (formato.state !== "BORRADOR" && formato.state !== "COTIZACION") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900">Tu pedido aún no está listo para pagar</h1>
        <p className="mt-2 text-gray-500">
          Estado actual: <span className="font-medium">{formato.state}</span>.
        </p>
        <a href="/formatos" className="mt-6 inline-block rounded-md bg-[#10B981] px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
          Ver mi Formato Único
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      <p className="mt-1 text-sm text-gray-500">Completa tus datos de envío y facturación para continuar al pago.</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="billingId" className="block text-sm font-medium text-gray-700">
              DNI / RUC
            </label>
            <input
              id="billingId"
              required
              value={billingId}
              onChange={(e) => setBillingId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]"
              placeholder="12345678"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Dirección de envío
            </label>
            <input
              id="address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]"
              placeholder="Av. Siempre Viva 742, Lima"
            />
          </div>

          {submitError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[#10B981] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
          >
            {submitting ? "Procesando..." : "Pagar ahora"}
          </button>
        </form>

        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Resumen del pedido</h2>
          <ul className="mt-4 space-y-3 divide-y divide-gray-100">
            {formato.items.map((item) => (
              <li key={item.product_id} className="pt-3 first:pt-0 flex justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{item.product_name || item.sku || item.product_id}</p>
                  <p className="text-gray-500">Cantidad: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-900">S/ {Number(item.subtotal).toFixed(2)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-sm font-semibold text-gray-900">
            <span>Subtotal</span>
            <span>S/ {Number(formato.subtotal).toFixed(2)}</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">El costo de envío se calcula al confirmar el pago.</p>
        </aside>
      </div>
    </main>
  );
}
