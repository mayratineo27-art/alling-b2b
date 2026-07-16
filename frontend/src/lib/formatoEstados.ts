// Presentación de estados del Formato Único (FSM-01) — RF-FU-010/RF-FU-012.
// Paleta pastel compartida por las tarjetas de /cuenta/formatos, /cotizaciones,
// /consultas y /pedidos, para mantener un lenguaje visual consistente.

export interface EstadoBadge {
  label: string;
  className: string;
}

export const FORMATO_BADGE: Record<string, EstadoBadge> = {
  BORRADOR: { label: "Borrador", className: "bg-blue-50 text-blue-700 border-blue-100" },
  COTIZACION: { label: "Cotización", className: "bg-amber-50 text-amber-700 border-amber-100" },
  CONSULTA: { label: "En consulta", className: "bg-purple-50 text-purple-700 border-purple-100" },
  RESUELTA: { label: "Resuelta", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  EXPIRADA: { label: "Expirada", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

// Estados transaccionales (post-venta, RF-FU-012) — se muestran en /pedidos,
// coloreados por el status real de la Order asociada, no por el estado del FU.
export const ORDER_BADGE: Record<string, EstadoBadge> = {
  PENDING_PAYMENT: { label: "Pago pendiente", className: "bg-amber-50 text-amber-700 border-amber-100" },
  PAID: { label: "Pagado", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  READY_TO_SHIP: { label: "Listo para envío", className: "bg-sky-50 text-sky-700 border-sky-100" },
  SHIPPED: { label: "Enviado", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  CANCELLED: { label: "Cancelado", className: "bg-red-50 text-red-600 border-red-100" },
};

export function getFormatoBadge(state: string): EstadoBadge {
  return FORMATO_BADGE[state] || { label: state, className: "bg-gray-100 text-gray-600 border-gray-200" };
}

export function getOrderBadge(status: string): EstadoBadge {
  return ORDER_BADGE[status] || { label: status, className: "bg-gray-100 text-gray-600 border-gray-200" };
}

const COTIZACION_VIGENCIA_DIAS = 15;

export interface Vigencia {
  diasRestantes: number;
  expirada: boolean;
}

// El backend serializa updated_at con datetime.utcnow() — un datetime NAIVE
// sin sufijo 'Z' ni offset (ej: "2026-07-11T23:28:12.058837"). El spec de
// ECMAScript interpreta un ISO string SIN designador de zona horaria como
// hora LOCAL del navegador, no UTC. En un navegador con offset negativo
// (ej. America/Lima, UTC-5) esto adelanta el instante interpretado ~5h,
// lo que al redondear con Math.ceil() agrega un día de más a la cuenta
// regresiva (vence "en 8 días" en vez de 7). Se normaliza forzando 'Z' si
// el string no trae ya un designador de zona horaria.
export function parseUtcDate(iso: string): Date {
  const tieneZonaHoraria = /Z$|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(tieneZonaHoraria ? iso : `${iso}Z`);
}

// RN-FU-03: la cotización congela precios y vence a los 7 días desde que se
// generó (updated_at se reinicia en ese momento — ver generar_cotizacion()).
export function getVigenciaCotizacion(updatedAt: string | null | undefined): Vigencia | null {
  if (!updatedAt) return null;
  const expiraEn = parseUtcDate(updatedAt).getTime() + COTIZACION_VIGENCIA_DIAS * 24 * 60 * 60 * 1000;
  const msRestantes = expiraEn - Date.now();
  return {
    diasRestantes: Math.max(0, Math.ceil(msRestantes / (24 * 60 * 60 * 1000))),
    expirada: msRestantes <= 0,
  };
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return parseUtcDate(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
