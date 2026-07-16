"use client";

import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { useCartContext } from "@/context/CartContext";
import { QuantityInput } from "./QuantityInput";

// T6-F4: Drawer lateral de carrito — no existía ningún componente
// Drawer/SlideOver en el frontend; el único "carrito" era la página
// completa /formatos. notas_actualizacion_diseno.md §2.
export function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, refresh } = useCartContext();
  const router = useRouter();

  const handleEliminar = async (productId: string) => {
    if (!cart) return;
    try {
      await apiClient.delete(`/formatos/${cart.id}/items/${productId}`);
      await refresh();
    } catch (err) {
      console.error("Error al eliminar ítem:", err);
    }
  };

  const handleComprarAhora = () => {
    closeDrawer();
    router.push("/checkout");
  };

  const handleGestionarPedido = () => {
    closeDrawer();
    router.push("/formatos");
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[90] bg-black/30 transition-opacity ${
          isDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-[95] flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Resumen del Formato Único"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Mi Formato Único</h2>
          <button onClick={closeDrawer} aria-label="Cerrar" className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <p className="text-sm text-gray-500">Tu Formato Único está vacío.</p>
              <a href="/productos" onClick={closeDrawer} className="text-sm font-medium text-[#10B981] hover:underline">
                Ir al catálogo →
              </a>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <li key={item.product_id} className="flex gap-3 border-b border-gray-50 pb-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-300">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.product_name || item.sku || item.product_id}
                    </p>
                    {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                    {item.kit_name && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        Kit: {item.kit_name}
                      </span>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <QuantityInput
                        formatoId={cart.id}
                        itemId={item.product_id}
                        initialQty={item.quantity}
                        stock={item.stock_disponible ?? Infinity}
                        isEditable={cart.state === "BORRADOR"}
                        onQuantityUpdated={refresh}
                      />
                      <button
                        onClick={() => handleEliminar(item.product_id)}
                        aria-label="Eliminar producto"
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="flex-shrink-0 text-sm font-semibold text-gray-900">
                    S/ {Number(item.subtotal).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">Subtotal Neto</span>
              <span className="text-xl font-bold text-gray-900">S/ {Number(cart.subtotal).toFixed(2)}</span>
            </div>
            <button
              onClick={handleComprarAhora}
              className="w-full rounded-lg bg-[#10B981] py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
            >
              Comprar ahora
            </button>
            <button
              onClick={handleGestionarPedido}
              className="mt-2 w-full rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Gestionar Pedido
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
