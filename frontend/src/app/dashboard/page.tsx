"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MainWidget from "@/components/dashboard/MainWidget";
import OrderHistoryTable from "@/components/dashboard/OrderHistoryTable";
import { useDashboardData } from "@/hooks/useDashboardData";
import apiClient from "@/lib/api";

export default function DashboardPage() {
  const { dashboardData, loading, error, refetch } = useDashboardData();



  // Callback action para enviar el formato a revisión
  const handleAction = async (formatoId: string) => {
    try {
      // Endpoint que confirmaría o enviaría a revisión el Formato Unico.
      // Se adapta según la API de tu backend. 
      await apiClient.post(`/formato-unico/${formatoId}/submit`);
      // Refrescamos los datos para reflejar el nuevo estado (ej. de BORRADOR a COTIZACION)
      await refetch();
    } catch (err) {
      console.error("No se pudo enviar a revisión:", err);
      // Idealmente, aquí lanzarías un toast o alerta
    }
  };

  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <DashboardLayout>
        {/* Renderizado Condicional: Estado de Carga */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 font-medium">Cargando tu panel de control...</p>
          </div>
        )}

        {/* Renderizado Condicional: Estado de Error */}
        {!loading && error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error de comunicación</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button 
                  onClick={refetch}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-500 underline"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Renderizado Principal del Dashboard */}
        {!loading && !error && dashboardData && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header del Dashboard */}
            <div className="border-b border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold leading-6 text-gray-900">
                  Panel de Control
                </h1>
                <p className="mt-2 max-w-4xl text-sm text-gray-500">
                  Gestiona tus cotizaciones activas y revisa el historial de tus compras corporativas.
                </p>
              </div>
              <a
                href="/formatos"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Ir a Formato Único
              </a>
            </div>

            <div className="space-y-6">
              {/* Sección 1: Widget del Formato Único Activo (Solo si existe) */}
              {dashboardData.formato_activo ? (
                <section>
                  <MainWidget 
                    data={dashboardData.formato_activo} 
                    onAction={handleAction} 
                  />
                </section>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center space-y-4">
                  <p className="text-gray-500">No tienes ninguna cotización o borrador activo.</p>
                  <a
                    href="/formatos"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
                  >
                    Ver / Crear Formato Único
                  </a>
                </div>
              )}

              {/* Sección 2: Historial de Pedidos */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Historial Reciente</h2>
                </div>
                <OrderHistoryTable orders={dashboardData.orders} />
              </section>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
