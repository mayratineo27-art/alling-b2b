// CMP-FU-019: Banner dinámico FSM (RF-FU-018, RF-FU-007)
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';

interface BannerFSMProps {
    formatoId: string;
    state: string;
    onStateChange: () => void;
}

export function BannerFSM({ formatoId, state, onStateChange }: BannerFSMProps) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { showToast } = useToast();

    // Simular un countdown de 15 días (RF-FU-007)
    // En producción, debería usar la fecha real de expiración que devuelve el backend.
    const [timeLeft, setTimeLeft] = useState<number>(15 * 24 * 60 * 60);

    useEffect(() => {
        // El backend usa el valor sin tilde (FormatoUnicoState.COTIZACION).
        if (state !== 'COTIZACION') return;
        
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [state]);

    const formatTime = (seconds: number) => {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${d}d ${h}h ${m}m ${s}s`;
    };

    const handleGenerarCotizacion = async () => {
        try {
            // Sprint 6 — Patrón de Clonación: la respuesta ahora es la
            // COTIZACIÓN clonada (un FU nuevo e independiente), no el mismo
            // FU que se está editando. El borrador activo (formatoId) queda
            // vacío y sigue editable de inmediato — por eso avisamos por
            // toast en vez de solo actualizar el estado en pantalla.
            const res = await apiClient.post(`/formatos/${formatoId}/aprobar`);
            const cotizacionId = res.data?.id;
            onStateChange();
            showToast("Cotización generada. Tu borrador sigue disponible para seguir comprando.", "success", [
                { label: "Ver cotización", onClick: () => router.push(`/cuenta/formatos/${cotizacionId}`) },
            ]);
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 403) {
                const detail = error.response?.data?.detail;
                if (detail === "No autorizado") {
                    alert("Debes iniciar sesión para gestionar cotizaciones.");
                } else {
                    alert(detail || "Acceso denegado (sesión inválida).");
                }
            } else {
                alert(getErrorMessage(error, "Error al generar cotización"));
            }
        }
    };

    const handleRenovarCotizacion = () => {
        alert("Funcionalidad de renovar cotización en construcción.");
    };

    const handleIrAPago = () => {
        router.push("/checkout");
    };

    const handleSolicitarAsesoria = async () => {
        try {
            await apiClient.post(`/formatos/${formatoId}/solicitar-consulta`);
            onStateChange();
            showToast("Tu solicitud de asesoría fue enviada. Un vendedor la revisará pronto.");
        } catch (error: any) {
            alert(getErrorMessage(error, "No se pudo solicitar asesoría."));
        }
    };

    if (state === 'BORRADOR') {
        return (
            <div className="bg-green-100 text-green-900 px-6 py-4 rounded-xl mb-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center shadow-sm">
                <div>
                    <h2 className="font-bold text-lg">Editando Borrador</h2>
                    <p className="text-sm">
                        {isAuthenticated
                            ? "Genera una cotización con 15 días de vigencia (sujeta a tipo de cambio y stock internacional), o compra directo."
                            : "Puedes comprar directo como invitado, o inicia sesión para generar una cotización."}
                    </p>
                </div>
                <div className="flex gap-3">
                    {isAuthenticated && (
                        <button
                            onClick={handleSolicitarAsesoria}
                            className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded-lg font-bold hover:bg-gray-50 transition"
                        >
                            Solicitar Asesoría
                        </button>
                    )}
                    {isAuthenticated && (
                        <button
                            onClick={handleGenerarCotizacion}
                            className="bg-white border border-green-600 text-green-700 px-5 py-2 rounded-lg font-bold hover:bg-green-50 transition"
                        >
                            Generar Cotización
                        </button>
                    )}
                    <button
                        onClick={handleIrAPago}
                        className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700 transition"
                    >
                        Comprar ahora
                    </button>
                </div>
            </div>
        );
    }

    if (state === 'COTIZACION') {
        return (
            <div className="bg-yellow-100 text-yellow-900 px-6 py-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="font-bold text-lg">Cotización Activa</h2>
                    <p className="text-sm font-mono font-medium">Válido por: {formatTime(timeLeft)}</p>
                </div>
                <button 
                    onClick={handleIrAPago}
                    className="bg-yellow-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-yellow-700 transition"
                >
                    Ir a Pago
                </button>
            </div>
        );
    }

    if (state === 'EXPIRADA') {
        return (
            <div className="bg-red-100 text-red-900 px-6 py-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="font-bold text-lg">Cotización Expirada</h2>
                    <p className="text-sm">El tiempo de validez de la cotización ha terminado.</p>
                </div>
                <button 
                    onClick={handleRenovarCotizacion}
                    className="bg-red-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-red-700 transition"
                >
                    Renovar Cotización
                </button>
            </div>
        );
    }

    if (state === 'PEDIDO' || state === 'APROBADO') {
        return (
            <div className="bg-blue-100 text-blue-900 px-6 py-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="font-bold text-lg">En proceso de pago / Confirmado</h2>
                    <p className="text-sm">Esta orden ya está siendo procesada.</p>
                </div>
            </div>
        );
    }

    return null;
}
