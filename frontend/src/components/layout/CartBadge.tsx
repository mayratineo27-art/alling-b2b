"use client";

import { useState } from "react";
import { useCartContext } from "@/context/CartContext";

// T6-F3: reemplaza el ícono plano (<Link href="/formatos">) por un badge
// numérico dinámico + popover en hover, y abre el Drawer en vez de navegar
// directo — notas_actualizacion_diseno.md §2 ("Efecto Hover" / "Efecto Click").
export default function CartBadge() {
  const { cart, count, openDrawer } = useCartContext();
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <button
        onClick={openDrawer}
        className="relative p-2 text-[var(--alling-metadata)] hover:text-[var(--alling-primary)] transition-colors rounded-md hover:bg-gray-50"
        aria-label="Mi formato único"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--alling-primary)] px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {showPopover && cart && cart.items.length > 0 && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="text-sm text-gray-700">
            {count} producto{count === 1 ? "" : "s"} en tu Formato Único
          </p>
          <p className="mt-1 text-sm font-bold text-gray-900">
            Subtotal: S/ {Number(cart.subtotal).toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-gray-400">Clic para gestionar</p>
        </div>
      )}
    </div>
  );
}
