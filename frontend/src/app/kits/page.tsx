'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { KitCard, SkeletonKitCard, KitType } from '@/components/catalogo/KitCard';
import Link from 'next/link';

export default function KitsPage() {
    const [kits, setKits] = useState<KitType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchKits = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get('/kits/');
                setKits(response.data);
                setError(null);
            } catch (err) {
                console.error(err);
                setError('Error al cargar los kits pre-armados.');
            } finally {
                setLoading(false);
            }
        };

        fetchKits();
    }, []);

    return (
        <main className="min-h-screen bg-gray-50 pb-16">
            <div className="bg-slate-900 py-16 text-center text-white">
                <h1 className="text-4xl font-bold tracking-tight">Kits Pre-armados</h1>
                <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
                    Soluciones integrales diseñadas para facilitar tus instalaciones. 
                    El precio se calcula dinámicamente según sus componentes.
                </p>
                <div className="mt-8">
                    <Link href="/categorias" className="text-sm font-semibold text-[#10B981] hover:text-emerald-400 transition-colors">
                        &larr; Volver al catálogo
                    </Link>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm text-center mb-6 max-w-3xl mx-auto">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map(i => <SkeletonKitCard key={i} />)}
                    </div>
                ) : kits.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {kits.map((kit) => (
                            <KitCard key={kit.id} kit={kit} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No hay kits disponibles</h3>
                        <p className="text-gray-500 text-center max-w-md">
                            En este momento no tenemos kits pre-armados disponibles. Vuelve más tarde o explora nuestro catálogo individual.
                        </p>
                        <Link 
                            href="/categorias"
                            className="mt-6 rounded-md bg-[#10B981] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 transition-colors"
                        >
                            Ver catálogo de productos
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
