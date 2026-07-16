import React from 'react';
import { useCartContext } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';

export interface KitComponentType {
    product_id: string;
    name: string;
    quantity: number;
}

export interface KitType {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    components: KitComponentType[];
    precio_total: number;
    stock_disponible: number;
}

export function KitCard({ kit }: { kit: KitType }) {
    const isOutOfStock = kit.stock_disponible <= 0;
    const { refresh: refreshCart, openDrawer } = useCartContext();
    const { showToast } = useToast();

    const [isAdding, setIsAdding] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [localError, setLocalError] = React.useState<string | null>(null);

    const handleAddKit = async () => {
        setIsAdding(true);
        setLocalError(null);
        try {
            const { default: apiClient } = await import('@/lib/api');

            // RF-CHK-007 / RNF-SEC-002: Obtener sesión activa por cookie (GUEST) o JWT (CUSTOMER).
            // NUNCA usar localStorage para el fu_id.
            let fuId: string | null = null;
            try {
                const meRes = await apiClient.get('/formatos/me');
                fuId = meRes.data.id;
            } catch (meErr: any) {
                // Si no hay sesión activa (404), crear sesión GUEST via cookie httpOnly
                if (meErr.response?.status === 404) {
                    await apiClient.post('/formatos/session');
                    // Volver a obtener el FU recién creado
                    const meRes2 = await apiClient.get('/formatos/me');
                    fuId = meRes2.data.id;
                } else {
                    throw meErr;
                }
            }

            if (!fuId) throw new Error("No se pudo obtener el Formato Único.");

            // Agregar Kit (sus componentes) al FU
            await apiClient.post(`/formatos/${fuId}/kits`, {
                kit_id: kit.id,
                cantidad: 1
            });

            // T6-F1/F2: antes esto dependía de window.confirm()/alert() —
            // si el usuario cerraba el diálogo o el navegador lo bloqueaba,
            // no quedaba ninguna señal visible de que el kit se agregó.
            // Ahora se integra con el mismo Toast + badge del carrito que
            // usan los productos individuales (ProductCard.tsx).
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
            await refreshCart();
            showToast(`Kit "${kit.name}" agregado a tu Formato Único.`, "success", [
                { label: "Seguir buscando", onClick: () => {} },
                { label: "Ver proforma", onClick: openDrawer },
            ]);
        } catch (error: any) {
            console.error("Error al agregar kit:", error);
            setLocalError(getErrorMessage(error, "Error al agregar el Kit al Formato Único."));
            setTimeout(() => setLocalError(null), 4000);
        } finally {
            setIsAdding(false);
        }
    };



    return (
        <div className={`flex flex-col rounded-xl border ${isOutOfStock ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
            {kit.image_url ? (
                <div className="relative h-48 w-full bg-gray-100">
                    <img 
                        src={kit.image_url} 
                        alt={kit.name} 
                        className={`h-full w-full object-cover ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
                    />
                    <div className="absolute top-2 right-2 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        Pre-armado
                    </div>
                </div>
            ) : (
                <div className="relative flex h-48 w-full items-center justify-center bg-gray-100">
                    <span className="text-gray-400 font-medium">Sin imagen</span>
                    <div className="absolute top-2 right-2 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        Pre-armado
                    </div>
                </div>
            )}
            
            <div className="flex flex-col p-5 flex-1">
                <h3 className={`text-lg font-bold ${isOutOfStock ? 'text-gray-600' : 'text-gray-900'} mb-1`}>{kit.name}</h3>
                {kit.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{kit.description}</p>
                )}

                <div className="mb-4 flex-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Componentes:</h4>
                    <ul className="space-y-1">
                        {kit.components.map((comp) => (
                            <li key={comp.product_id} className="text-sm text-gray-700 flex justify-between">
                                <span className="truncate pr-2">- {comp.name}</span>
                                <span className="font-medium text-gray-500 shrink-0">x{comp.quantity}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-auto border-t border-gray-100 pt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-medium text-gray-500">Precio Total</span>
                        <span className="text-xl font-bold text-[#10B981]">S/ {Number(kit.precio_total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Stock Efectivo:</span>
                        <span className={`font-bold ${isOutOfStock ? 'text-red-500' : 'text-gray-700'}`}>
                            {kit.stock_disponible} {kit.stock_disponible === 1 ? 'unidad' : 'unidades'}
                        </span>
                    </div>

                    {localError && (
                        <p className="text-xs text-red-600 font-medium text-center">{localError}</p>
                    )}

                    <button
                        disabled={isOutOfStock || isAdding}
                        className={`mt-2 w-full rounded-md py-2 text-sm font-bold shadow-sm transition-colors ${
                            isOutOfStock
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : success
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#10B981] text-white hover:bg-emerald-600'
                        }`}
                        onClick={handleAddKit}
                    >
                        {isAdding ? 'Agregando componentes...' : isOutOfStock ? 'Kit Agotado' : success ? '¡Agregado ✓!' : 'Agregar al FU'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function SkeletonKitCard() {
    return (
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm animate-pulse">
            <div className="h-48 w-full bg-gray-200"></div>
            <div className="p-5 flex flex-col gap-4">
                <div className="h-6 w-3/4 rounded bg-gray-200"></div>
                <div className="h-4 w-full rounded bg-gray-200"></div>
                <div className="h-20 w-full rounded bg-gray-200 mt-2"></div>
                <div className="mt-4 flex justify-between items-end pt-4 border-t border-gray-100">
                    <div className="h-4 w-1/4 rounded bg-gray-200"></div>
                    <div className="h-8 w-1/3 rounded bg-gray-200"></div>
                </div>
                <div className="h-10 w-full rounded bg-gray-200 mt-2"></div>
            </div>
        </div>
    );
}
