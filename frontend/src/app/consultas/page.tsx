import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FormatoHistorialBoard } from "@/components/formato/FormatoHistorialBoard";

// RF-FU-010: consultas de asesoría técnica pre-venta y su respuesta.
export default function ConsultasPage() {
  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <DashboardLayout>
        <FormatoHistorialBoard
          title="Mis Consultas"
          subtitle="Solicitudes de asesoría técnica y respuestas de nuestro equipo."
          initialTab="consultas"
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
