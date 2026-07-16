'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import { CategoryGrid } from '@/components/catalogo/CategoryGrid';
import { ProductCard, SkeletonCard, Product } from '@/components/catalogo/ProductCard';

// Interfaces mantenidas
interface CategoryCount {
    nombre: string;
    count: number;
}

interface LandingData {
    destacados: Product[];
    novedades: Product[];
    categorias_conteo: CategoryCount[];
}

export default function Home() {
    const router = useRouter();
    const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
    const [data, setData] = useState<LandingData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [heroImage, setHeroImage] = useState<string | null>(null);

    // CA-CAT-004 (Escenario 2): CUSTOMER autenticado que visita "/" es redirigido al Dashboard.
    useEffect(() => {
        if (!isAuthLoading && isAuthenticated && user?.role === 'CUSTOMER') {
            router.replace('/dashboard');
        }
    }, [isAuthLoading, isAuthenticated, user, router]);

    useEffect(() => {
        const fetchLandingData = async () => {
            try {
                const response = await apiClient.get('/productos/landing');
                setData(response.data);
                setError(null);
            } catch (err: any) {
                console.error(err);
                setError('Ocurrió un error al cargar el catálogo. Por favor, intenta de nuevo más tarde.');
            } finally {
                setLoading(false);
            }
        };

        const fetchHeroImage = async () => {
            try {
                // Hacer fetch al endpoint para generar la imagen con Gemini
                const response = await apiClient.get('/api/v1/system/generate-hero');
                if (response.data && response.data.image_url) {
                    setHeroImage(response.data.image_url);
                }
            } catch (err: any) {
                console.error("Error cargando imagen hero:", err);
            }
        };

        fetchLandingData();
        fetchHeroImage();
    }, []);

    if (loading || (isAuthenticated && user?.role === 'CUSTOMER')) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="h-16 w-16 rounded-full border-4 border-[#10B981] border-t-transparent animate-spin"></div>
                    <p className="text-lg font-medium text-gray-500">Cargando Portal B2B...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-4">
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
        <main className="min-h-screen bg-gray-50 pb-12">
            {/* HERO SECTION CON EFECTO BOKEH MEJORADO */}
            <section 
                className="relative overflow-hidden bg-slate-900 text-white py-24 sm:py-32"
                style={heroImage ? { backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {/* Fondo simulando fibra óptica / Bokeh */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/40 rounded-full blur-[120px]"></div>
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6">
                        Portal B2B <span className="text-[#10B981]">Alling</span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-300 leading-relaxed">
                        Abastece tu negocio con los mejores equipos de telecomunicaciones.
                        Conéctate con nuestra red de distribución especializada.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/productos" className="rounded-md bg-[#10B981] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-all">
                            Explorar Catálogo
                        </Link>
                        <Link href="/nosotros" className="text-sm font-semibold leading-6 text-white hover:text-[#10B981] transition-colors">
                            Conoce Alling <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 space-y-20">

                {/* CATEGORÍAS (Siempre visible aunque esté vacío) */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                        <span className="w-1 h-8 bg-[#10B981] rounded-full"></span>
                        Explorar Categorías
                    </h2>
                    <CategoryGrid categories={data?.categorias_conteo || []} />
                </section>

                {/* DESTACADOS */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-1 h-8 bg-[#10B981] rounded-full"></span>
                            Productos Destacados
                        </h2>
                        <Link href="/productos" className="text-sm font-medium text-[#10B981] hover:text-emerald-700 transition-colors">Ver todos &rarr;</Link>
                    </div>

                    {data?.destacados && data.destacados.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {data.destacados.map((product) => (
                                <ProductCard key={product.id} product={product} badge="Destacado" showPrice={false} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 opacity-50 pointer-events-none">
                            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                        </div>
                    )}
                </section>

                {/* NOVEDADES */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-1 h-8 bg-[#10B981] rounded-full"></span>
                            Nuevos Ingresos
                        </h2>
                        <Link href="/productos" className="text-sm font-medium text-[#10B981] hover:text-emerald-700 transition-colors">Ver todos &rarr;</Link>
                    </div>

                    {data?.novedades && data.novedades.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {data.novedades.map((product) => (
                                <ProductCard key={product.id} product={product} badge="Nuevo" badgeColor="green" showPrice={false} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-100 rounded-xl p-8 text-center text-gray-500 border-dashed border-2 border-gray-300">
                            Los nuevos ingresos aparecerán aquí tras configurar el backend.
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}