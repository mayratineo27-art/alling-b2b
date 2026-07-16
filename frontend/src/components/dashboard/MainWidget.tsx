import React, { useState } from "react";
import { FormatoUnicoActive } from "@/hooks/useDashboardData";

interface MainWidgetProps {
  data: FormatoUnicoActive;
  onAction: (id: string) => Promise<void>;
}

export default function MainWidget({ data, onAction }: MainWidgetProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleActionClick = async () => {
    setIsProcessing(true);
    try {
      await onAction(data.id);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función auxiliar para determinar el color del badge basado en el estado
  const getBadgeStyle = (state: string) => {
    // Normalizar el estado por si viene en minúsculas o con espacios
    const normalizedState = state.toUpperCase().trim();
    
    switch (normalizedState) {
      // Mapeo directo de las instrucciones
      case "DRAFT":
      case "BORRADOR": // Soporte para el estado real del backend
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING_REVIEW":
      case "COTIZACION": // Soporte para el estado real del backend
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "COMPLETED":
      case "CONFIRMADO": // Soporte para el estado real del backend
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Función auxiliar para formatear la moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  const badgeStyle = getBadgeStyle(data.state);
  // El backend manda updated_at, usamos ese o creamos una fecha fallback
  const displayDate = data.updated_at ? data.updated_at : new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        
        {/* Cabecera del Widget: Información del Formato */}
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              Formato Único Activo
            </h2>
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${badgeStyle}`}>
              {data.state}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">ID de Referencia</p>
              <p className="text-base text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                {data.id.split("-")[0].toUpperCase()}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Última Actualización</p>
              <p className="text-base text-gray-900 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {displayDate.toLocaleDateString('es-PE', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="sm:col-span-2 mt-2 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-1">Total del Formato</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(data.subtotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Área de Acción Condicional */}
        <div className="md:border-l md:border-gray-100 md:pl-8 flex flex-col justify-center items-center md:items-end min-w-[240px]">
          {/* Lógica basada en el estado DRAFT o BORRADOR */}
          {(data.state === "DRAFT" || data.state === "BORRADOR") && (
            <div className="w-full text-center md:text-right">
              <p className="text-sm text-gray-500 mb-4">
                Tienes {data.items.length} ítems listos para procesar.
              </p>
              <button
                onClick={handleActionClick}
                disabled={isProcessing}
                className="w-full md:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  "Enviar a Revisión"
                )}
              </button>
            </div>
          )}

          {/* Lógica basada en el estado PENDING_REVIEW o COTIZACION */}
          {(data.state === "PENDING_REVIEW" || data.state === "COTIZACION") && (
            <div className="w-full bg-yellow-50 rounded-lg p-4 text-center md:text-left border border-yellow-100">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">En Proceso</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Esperando validación del administrador
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lógica basada en el estado COMPLETED o CONFIRMADO */}
          {(data.state === "COMPLETED" || data.state === "CONFIRMADO") && (
            <div className="w-full text-center md:text-right">
              <p className="text-sm font-medium text-green-600 mb-2 flex items-center justify-center md:justify-end">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Formato Aprobado
              </p>
              <button
                onClick={() => window.location.href = `/pedidos/${data.id}`}
                className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ver Pedido Final
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
