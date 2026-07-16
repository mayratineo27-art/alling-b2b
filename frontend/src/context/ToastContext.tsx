"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "warning" | "error" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  actions?: ToastAction[];
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, actions?: ToastAction[]) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextToastId = 1;

// Sistema de Toast mínimo (T6-F1): no existía ningún mecanismo de feedback
// no bloqueante en el frontend — todo era alert() o estado local con
// setTimeout. Soporta acciones (ej. "Seguir buscando" / "Ver proforma",
// notas_actualizacion_diseno.md §2).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info", actions?: ToastAction[]) => {
    const id = nextToastId++;
    setToasts((prev) => [...prev, { id, message, type, actions }]);
    setTimeout(() => dismiss(id), 6000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed top-20 right-4 z-[100] flex w-80 max-w-[90vw] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto relative rounded-xl border p-4 pr-8 shadow-lg ${
              t.type === "success" ? "border-green-200 bg-green-50" :
              t.type === "warning" ? "border-yellow-200 bg-yellow-50" :
              t.type === "error"   ? "border-red-200 bg-red-50" :
              "border-gray-200 bg-white"
            }`}
          >
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar"
              className="absolute top-2 right-2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <p className={`text-sm ${
              t.type === "success" ? "text-green-800" :
              t.type === "warning" ? "text-yellow-800" :
              t.type === "error"   ? "text-red-800" :
              "text-gray-800"
            }`}>{t.message}</p>
            {t.actions && t.actions.length > 0 && (
              <div className="mt-3 flex gap-4">
                {t.actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      action.onClick();
                      dismiss(t.id);
                    }}
                    className="text-sm font-semibold text-[#10B981] hover:underline"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
