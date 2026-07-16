// CMP-FU-002: Control de Cantidad Inline (RF-FU-003)
import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';

interface QuantityInputProps {
    formatoId: string;
    itemId: string;
    initialQty: number;
    stock: number;
    isEditable: boolean;
    onQuantityUpdated: () => void;
}

export function QuantityInput({ formatoId, itemId, initialQty, stock, isEditable, onQuantityUpdated }: QuantityInputProps) {
    const [qty, setQty] = useState(initialQty);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isExceedingStock = qty > stock;

    useEffect(() => {
        setQty(initialQty);
    }, [initialQty]);

    const handleUpdate = async (newQty: number) => {
        if (newQty < 1) return;
        
        setQty(newQty);
        setError(null);

        // Disparar PATCH de inmediato al backend
        setIsUpdating(true);
        try {
            await apiClient.patch(`/formatos/${formatoId}/items/${itemId}`, {
                cantidad: newQty
            });
            onQuantityUpdated(); // trigger refresh
        } catch (err: any) {
            console.error("Error updating quantity:", err);
            // Revert on error
            setQty(initialQty);
            setError(err.response?.data?.detail || "Error al actualizar");
            
            // Auto hide error after 3s
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsUpdating(false);
        }
    };

    if (!isEditable) {
        return <span className="font-medium text-gray-700">{initialQty}</span>;
    }

    return (
        <div className="flex flex-col gap-1 items-start">
            <div className={`relative flex items-center border rounded-md overflow-hidden bg-white shadow-sm transition-colors
                ${isExceedingStock ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-300'}`}>
                
                <button 
                    onClick={() => handleUpdate(qty - 1)}
                    disabled={qty <= 1 || isUpdating}
                    className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                    aria-label="Disminuir cantidad"
                >
                    -
                </button>
                
                <input 
                    type="number" 
                    value={qty}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) handleUpdate(val);
                    }}
                    disabled={isUpdating}
                    className="w-12 text-center text-sm border-x border-gray-200 outline-none p-1 font-medium text-gray-800"
                />
                
                <button 
                    onClick={() => handleUpdate(qty + 1)}
                    disabled={isUpdating || qty >= stock}
                    className={`px-2.5 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50 ${isExceedingStock ? 'cursor-not-allowed' : ''}`}
                    aria-label="Aumentar cantidad"
                >
                    +
                </button>
            </div>
            
            {isExceedingStock && (
                <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">
                    Stock insuficiente: {stock} u.
                </span>
            )}

            {error && (
                <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">
                    {error}
                </span>
            )}
        </div>
    );
}
