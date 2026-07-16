import React from 'react';
import { QuantityInput } from './QuantityInput';
import { TelegramButton } from './TelegramButton';

interface FormatoItem {
    product_id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    stock_disponible: number;
    kit_id?: string | null;
    kit_name?: string | null;
}

interface FormatoTableProps {
    formatoId: string;
    state: string;
    items: FormatoItem[];
    onDataChanged: () => void;
    onDeleteItem?: (productId: string) => Promise<void>;
}

export function FormatoTable({ formatoId, state, items, onDataChanged, onDeleteItem }: FormatoTableProps) {
    const isEditable = state === 'BORRADOR';

    if (items.length === 0) {
        return (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">
                <p className="text-gray-500">No hay ítems en tu Formato Único aún.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600">Producto</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">SKU</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 text-center">Cantidad</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 text-right">Precio Unit.</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 text-right">Subtotal</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map(item => {
                            const showTelegram = item.stock_disponible === 0 || item.quantity > item.stock_disponible;
                            
                            return (
                                <tr key={item.product_id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-800 line-clamp-1" title={item.product_name}>
                                            {item.product_name || "Producto sin nombre"}
                                        </p>
                                        {item.kit_name && (
                                            <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                                Kit: {item.kit_name}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 font-mono text-sm text-gray-500">
                                        {item.sku || "N/A"}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center">
                                            <QuantityInput 
                                                formatoId={formatoId}
                                                itemId={item.product_id}
                                                initialQty={item.quantity}
                                                stock={item.stock_disponible}
                                                isEditable={isEditable}
                                                onQuantityUpdated={onDataChanged}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4 text-right text-sm font-medium text-gray-600">
                                        S/ {Number(item.unit_price).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-900">
                                        S/ {Number(item.subtotal).toFixed(2)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center items-center gap-2">
                                            <TelegramButton 
                                                sku={item.sku || item.product_id.substring(0,8)} 
                                                productName={item.product_name || "Producto"} 
                                                quantity={item.quantity} 
                                                type="details"
                                            />
                                            {showTelegram && (
                                                <TelegramButton 
                                                    sku={item.sku || item.product_id.substring(0,8)} 
                                                    productName={item.product_name || "Producto"} 
                                                    quantity={item.quantity} 
                                                    type="stock"
                                                />
                                            )}
                                            {isEditable && onDeleteItem && (
                                                <button
                                                    onClick={() => onDeleteItem(item.product_id)}
                                                    className="inline-flex items-center justify-center p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                    title="Eliminar ítem"
                                                    aria-label={`Eliminar ${item.product_name} del formato`}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
