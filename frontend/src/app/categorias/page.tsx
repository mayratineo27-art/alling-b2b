'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { CategoryGrid } from '@/components/catalogo/CategoryGrid';
import Link from 'next/link';

interface CategoryCount {
    nombre: string;
    count: number;
}

export default function CategoriasPage() {
    const [categorias, setCategorias] = useState<CategoryCount[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiClient.get('/productos/landing');
                if (response.data && response.data.categorias_conteo) {
                    setCategorias(response.data.categorias_conteo);
                }
                setError(null);
            } catch (err: any) {
                console.error(err);
                setError('Ocurrió un error al cargar las categorías. Por favor, intenta de nuevo.');
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="h-16 w-16 rounded-full border-4 border-[#10B981] border-t-transparent animate-spin"></div>
                    <p className="text-lg font-medium text-gray-500">Cargando categorías...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-gray-50 p-4">
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm max-w-md text-center">
                    <h2 className="mb-2 text-xl font-bold text-red-700">Error de conexión</h2>
                    <p className="text-red-600">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-16">
            <div className="bg-slate-900 py-16 text-center text-white">
                <h1 className="text-4xl font-bold tracking-tight">Explora nuestro Catálogo</h1>
                <p className="mt-4 text-lg text-gray-300">Selecciona una categoría para ver los productos disponibles</p>
                <div className="mt-8">
                    <Link href="/productos" className="text-sm font-semibold text-[#10B981] hover:text-emerald-400 transition-colors">
                        Ver todos los productos &rarr;
                    </Link>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <CategoryGrid categories={categorias} />
            </div>
        </main>
    );
}
