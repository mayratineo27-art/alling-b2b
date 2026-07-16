import React from "react";
import { OrderSummary } from "@/hooks/useDashboardData";
import Link from "next/link";

interface OrderHistoryTableProps {
  orders: OrderSummary[];
}

export default function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
  // Manejo de estado vacío
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No hay pedidos previos aún</h3>
        <p className="text-gray-500">Aquí aparecerá el historial de todas tus compras B2B confirmadas.</p>
      </div>
    );
  }

  // Utilidad para formatear la moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  // Utilidad para formatear la fecha a DD/MM/YYYY
  const formatDate = (date: Date | null) => {
    if (!date) return "--/--/----";
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Utilidad para estilos de estado del pedido
  const getBadgeStyle = (status: string) => {
    const normalizedStatus = status.toUpperCase().trim();
    
    // Mapeamos los estados del backend a los colores solicitados
    if (normalizedStatus.includes("PENDING")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    if (normalizedStatus.includes("SHIPPED") || normalizedStatus.includes("READY")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    if (normalizedStatus.includes("DELIVERED") || normalizedStatus.includes("PAID")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (normalizedStatus.includes("CANCELLED")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Vista de Tabla para Escritorio (Desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-200 text-sm font-semibold text-gray-600 tracking-wider">
              <th className="py-4 px-6">Fecha</th>
              <th className="py-4 px-6">ID Pedido</th>
              <th className="py-4 px-6 text-right">Total</th>
              <th className="py-4 px-6">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {orders.map((order, index) => (
              <tr 
                key={order.id} 
                className={`transition-colors hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="py-4 px-6 whitespace-nowrap">
                  {formatDate(order.created_at)}
                </td>
                <td className="py-4 px-6 whitespace-nowrap font-mono text-gray-900">
                  <Link href={`/pedidos/${order.id}`} className="hover:text-blue-600 hover:underline">
                    {order.id.split("-")[0].toUpperCase()}
                  </Link>
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-right font-medium text-gray-900">
                  {formatCurrency(order.total_amount)}
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle(order.status)}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de Tarjetas Apiladas para Móviles (Mobile) */}
      <div className="md:hidden divide-y divide-gray-100">
        {orders.map((order, index) => (
          <div 
            key={order.id} 
            className={`p-5 flex flex-col space-y-3 ${index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}`}
          >
            <div className="flex justify-between items-center">
              <Link href={`/pedidos/${order.id}`} className="font-mono text-sm font-semibold text-blue-600 hover:underline">
                #{order.id.split("-")[0].toUpperCase()}
              </Link>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle(order.status)}`}>
                {order.status.replace("_", " ")}
              </span>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-500 mb-1">Fecha de compra</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(order.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
