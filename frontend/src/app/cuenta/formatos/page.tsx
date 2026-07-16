import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FormatoHistorialBoard } from "@/components/formato/FormatoHistorialBoard";

// SCR-FU-002 (RF-FU-010, CA-FU-010): vista general del historial de
// Formatos Únicos. /cotizaciones y /consultas son entradas enfocadas al
// mismo tablero (initialTab distinto); esta ruta abre en "Todos".
export default function HistorialFormatosPage() {
  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <DashboardLayout>
        <FormatoHistorialBoard
          title="Mis Formatos Únicos"
          subtitle="Historial de tus borradores, cotizaciones y consultas."
          initialTab="todos"
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
