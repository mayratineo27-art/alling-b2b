import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FormatoHistorialBoard } from "@/components/formato/FormatoHistorialBoard";

// RF-FU-010 (etapa pre-venta/planificación): BORRADOR con precios sincronizados
// del catálogo y COTIZACION con precios congelados, vigencia de 7 días y PDF.
export default function CotizacionesPage() {
  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <DashboardLayout>
        <FormatoHistorialBoard
          title="Mis Cotizaciones"
          subtitle="Borradores y propuestas comerciales generadas a partir de tu Formato Único."
          initialTab="cotizaciones"
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
