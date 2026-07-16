import { Upload, FileText, CreditCard } from "lucide-react";

// T6-F5: Guía visual de onboarding B2B para CUSTOMER nuevo (hasHistory =
// false) — notas_actualizacion_diseno.md §1.B. Se muestra solo mientras el
// borrador está vacío; desaparece en cuanto se agrega el primer ítem.
export function OnboardingGuide() {
  const pasos = [
    {
      icon: Upload,
      titulo: "1. Agregar",
      texto: "Añade ítems navegando por el catálogo o subiendo un archivo Excel con tu lista de productos.",
    },
    {
      icon: FileText,
      titulo: "2. Cotizar",
      texto: "Al presionar \"Generar Cotización PDF\", tus precios se congelan por 15 días mediante un documento comercial.",
    },
    {
      icon: CreditCard,
      titulo: "3. Pagar",
      texto: "Formaliza tu pedido ingresando tus datos en el checkout para activar el envío Shalom.",
    },
  ];

  return (
    <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50/60 p-6">
      <h2 className="mb-1 text-lg font-bold text-gray-900">Bienvenido a tu Formato Único</h2>
      <p className="mb-6 text-sm text-gray-500">
        Así funciona el flujo de compra corporativa en 3 pasos.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {pasos.map((paso) => (
          <div key={paso.titulo} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#10B981]/10 text-[#10B981]">
              <paso.icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">{paso.titulo}</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{paso.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
