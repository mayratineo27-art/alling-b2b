"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCartContext } from "@/context/CartContext";
import { BannerFSM } from "@/components/formato/BannerFSM";
import { ExcelImporter } from "@/components/formato/ExcelImporter";
import { FormatoTable } from "@/components/formato/FormatoTable";
import { BulkTelegramButton } from "@/components/formato/TelegramButton";
import { OnboardingGuide } from "@/components/formato/OnboardingGuide";
import { RepurchaseWidget } from "@/components/formato/RepurchaseWidget";

export default function FormatosPage() {
    const { isAuthenticated } = useAuth();
    const { refresh: refreshCartBadge } = useCartContext();
    const [formato, setFormato] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasHistory, setHasHistory] = useState(false);

    // T6-B4/F5/F6: rama la interfaz entre GUEST, CUSTOMER nuevo y CUSTOMER
    // recurrente (notas_actualizacion_diseno.md §1). Se refresca junto con
    // el formato (no solo al montar) porque generar la PRIMERA cotización
    // cambia hasHistory de false a true en el acto — si no se refresca, el
    // onboarding se queda pegado en vez de dar paso al Widget de Recompra.
    const refreshHasHistory = async () => {
        if (!isAuthenticated) {
            setHasHistory(false);
            return;
        }
        try {
            const res = await apiClient.get('/formatos/tiene-historial');
            setHasHistory(Boolean(res.data?.has_history));
        } catch {
            setHasHistory(false);
        }
    };

    const fetchFormato = async () => {
        setLoading(true);
        setError(null);
        try {
            // RF-CHK-007 / RNF-SEC-002: Usar /formatos/me como fuente única de verdad.
            // El FU se resuelve por cookie httpOnly (GUEST) o JWT en header (CUSTOMER).
            // NUNCA leer localStorage para obtener el fu_id.
            try {
                const res = await apiClient.get('/formatos/me');
                setFormato(res.data);
            } catch (meErr: any) {
                if (meErr.response?.status === 404) {
                    // No hay sesión activa → crear sesión GUEST con cookie httpOnly
                    await apiClient.post('/formatos/session');
                    const res = await apiClient.get('/formatos/me');
                    setFormato(res.data);
                } else {
                    throw meErr;
                }
            }
        } catch (err: any) {
            console.error("Error fetching Formato:", err);
            setError("No se pudo cargar el Formato Único. " + (err.response?.data?.detail || err.message || ""));
        } finally {
            setLoading(false);
        }
        refreshCartBadge();
        refreshHasHistory();
    };

    const handleDeleteItem = async (productId: string) => {
        if (!formato) return;
        try {
            await apiClient.delete(`/formatos/${formato.id}/items/${productId}`);
            await fetchFormato();
        } catch (err: any) {
            console.error("Error deleting item:", err);
            alert("No se pudo eliminar el producto del formato.");
        }
    };

    const handleClearFormat = async () => {
        if (!formato) return;
        if (!window.confirm("¿Seguro que deseas vaciar por completo tu Formato Único? Esta acción no se puede deshacer.")) {
            return;
        }
        try {
            await apiClient.delete(`/formatos/${formato.id}/items`);
            await fetchFormato();
        } catch (err: any) {
            console.error("Error clearing format:", err);
            alert("No se pudo vaciar el formato.");
        }
    };

    const handleCleanErrors = async () => {
        if (!formato) return;
        if (!window.confirm("¿Seguro que deseas limpiar todas las filas con error?")) {
            return;
        }
        try {
            await apiClient.post(`/formatos/${formato.id}/clean-errors`);
            await fetchFormato();
        } catch (err: any) {
            console.error("Error cleaning errors:", err);
            alert("No se pudo limpiar las filas con error.");
        }
    };

    useEffect(() => {
        refreshHasHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    useEffect(() => {
        fetchFormato();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto p-6 max-w-5xl py-12 flex justify-center items-center h-64">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 border-4 border-t-[#10B981] border-gray-200 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Cargando Formato Único...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6 max-w-5xl py-12">
                <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center">
                    <p className="text-red-600 font-bold mb-4">{error}</p>
                    <button 
                        onClick={fetchFormato}
                        className="bg-red-600 text-white px-6 py-2 rounded shadow hover:bg-red-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!formato) return null;

    // Extract items needing telegram consultation for Bulk action (CMP-FU-020)
    const itemsNeedingConsultation = formato.items
        .filter((item: any) => item.stock_disponible === 0 || item.quantity > item.stock_disponible)
        .map((item: any) => ({
            sku: item.sku || item.product_id.substring(0,8),
            productName: item.product_name || "Producto",
            quantity: item.quantity
        }));

    // T6-F7: CUSTOMER nuevo (sin historial) ve la guía de onboarding
    // mientras su borrador siga vacío; CUSTOMER recurrente ve el Widget de
    // Recompra en la columna lateral; GUEST no ve ninguno de los dos.
    const mostrarOnboarding = isAuthenticated && !hasHistory && formato.items.length === 0;
    const mostrarWidgetRecompra = isAuthenticated && hasHistory;

    const zonaDeTrabajo = (
        <>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Mi Formato Único</h1>

            {/* CMP-FU-019: Banner dinámico FSM */}
            <BannerFSM
                formatoId={formato.id}
                state={formato.state}
                onStateChange={fetchFormato}
            />

            {mostrarOnboarding && <OnboardingGuide />}

            {/* CMP-FU-016/017/018: Importación Excel */}
            {formato.state === 'BORRADOR' && (
                <ExcelImporter
                    formatoId={formato.id}
                    onImportSuccess={fetchFormato}
                />
            )}

            {/* CMP-FU-002: Tabla de Ítems */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Ítems ({formato.items.length})</h2>
                    {formato.state === 'BORRADOR' && formato.items.length > 0 && (
                        <div className="flex items-center gap-3">
                            {formato.items.some((item: any) => !item.sku || item.sku === 'N/A' || item.stock_disponible === 0) && (
                                <button
                                    onClick={handleCleanErrors}
                                    className="px-4 py-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition shadow-sm font-semibold text-sm"
                                >
                                    Limpiar Filas con Error
                                </button>
                            )}
                            <button
                                onClick={handleClearFormat}
                                className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition shadow-sm font-semibold text-sm"
                            >
                                Vaciar Formato Único
                            </button>
                        </div>
                    )}
                </div>
                <FormatoTable
                    formatoId={formato.id}
                    state={formato.state}
                    items={formato.items}
                    onDataChanged={fetchFormato}
                    onDeleteItem={handleDeleteItem}
                />
            </div>

            {/* Total General */}
            {formato.items.length > 0 && (
                <div className="flex justify-end bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Subtotal Neto</p>
                        <p className="text-3xl font-black text-[#10B981]">
                            S/ {Number(formato.subtotal).toFixed(2)}
                        </p>
                    </div>
                </div>
            )}

            {/* CMP-FU-020: Integración Telegram (Bulk) */}
            <BulkTelegramButton items={itemsNeedingConsultation} />
        </>
    );

    if (mostrarWidgetRecompra) {
        return (
            <div className="container mx-auto p-6 max-w-6xl py-12">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
                    <div className="min-w-0">{zonaDeTrabajo}</div>
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <RepurchaseWidget onBorradorActualizado={fetchFormato} />
                    </aside>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-5xl py-12">
            {zonaDeTrabajo}
        </div>
    );
}
