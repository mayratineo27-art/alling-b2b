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
    image_url?: string | null;
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
                const response = await apiClient.get('/admin/configuracion/public-hero');
                if (response.data && response.data.hero_banner_url) {
                    setHeroImage(response.data.hero_banner_url);
                }
            } catch (err: any) {
                console.error("Error cargando imagen hero de portada:", err);
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
            {/* HERO SECTION SEGÚN EL PROTOTIPO DE LA CAPTURA */}
            <section 
                className="relative overflow-hidden bg-gradient-to-r from-[#D94600] via-[#EA580C] to-[#F97316] text-white py-8 lg:py-10"
                style={heroImage ? { backgroundImage: `linear-gradient(90deg, rgba(217,70,0,0.88) 0%, rgba(234,88,12,0.85) 60%, rgba(249,115,22,0.75) 100%), url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >

                {/* Patrón de cuadrícula / red de fondo */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Columna Izquierda: Títulos y Pilares */}
                        <div className="lg:col-span-7 space-y-6 text-left">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                                Soluciones de Infraestructura que impulsan tu negocio
                            </h1>
                            <p className="text-white/95 text-base sm:text-lg font-medium max-w-xl leading-relaxed">
                                Tecnología, conectividad y seguridad para empresas que buscan rendimiento y confiabilidad.
                            </p>

                            <div className="pt-2">
                                <Link 
                                    href="/productos" 
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-7 py-3.5 text-base font-extrabold text-white shadow-xl transition-all hover:scale-105"
                                >
                                    <span>Ver Ofertas Especiales</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </Link>
                            </div>

                            {/* Tres Pilares de Confianza en el Hero */}
                            <div className="pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white">Marcas líderes</p>
                                        <p className="text-white/80 text-[0.7rem] font-normal">Calidad garantizada</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white">Entrega rápida</p>
                                        <p className="text-white/80 text-[0.7rem] font-normal">A todo el país</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white">Soporte experto</p>
                                        <p className="text-white/80 text-[0.7rem] font-normal">Asesoría personalizada</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Columna Derecha: Tarjeta destacada Ubiquiti / Soluciones */}
                        <div className="lg:col-span-5 flex flex-col items-center justify-center">
                            <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black text-white tracking-wider">UBIQUITI</span>
                                </div>
                                <p className="text-sm text-white/90 font-medium">
                                    Tecnología Ubiquiti para redes empresariales de alto rendimiento.
                                </p>
                                <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[0.7rem] font-bold">
                                    <div className="bg-blue-500/20 backdrop-blur-xs rounded-xl p-2.5 flex flex-col items-center gap-1 border border-blue-400/30">
                                        <svg className="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 3v18M6 9v12M18 14v7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                        </svg>
                                        <span>Conectividad</span>
                                    </div>
                                    <div className="bg-sky-500/20 backdrop-blur-xs rounded-xl p-2.5 flex flex-col items-center gap-1 border border-sky-400/30">
                                        <svg className="w-5 h-5 text-sky-300" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                                        </svg>
                                        <span>Seguridad</span>
                                    </div>
                                    <div className="bg-amber-500/20 backdrop-blur-xs rounded-xl p-2.5 flex flex-col items-center gap-1 border border-amber-400/30">
                                        <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M18 20V10M12 20V4M6 20v-6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Escalabilidad</span>
                                    </div>
                                    <div className="bg-orange-500/20 backdrop-blur-xs rounded-xl p-2.5 flex flex-col items-center gap-1 border border-orange-400/30">
                                        <svg className="w-5 h-5 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="3" strokeWidth="2" />
                                        </svg>
                                        <span>Gestión</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BARRA FLOTANTE DE 4 GARANTÍAS (Abajo del Hero) */}
            <div className="relative z-20 max-w-7xl mx-auto px-6 -mt-6">
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-slate-800">
                    {/* Item 1: Productos 100% Originales (Escudo Azul) */}
                    <div className="flex items-center gap-4 pt-2 sm:pt-0 sm:pl-2">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50/80 border border-orange-100/50 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-[#0284C7]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-extrabold text-sm text-slate-900">Productos 100% Originales</h4>
                            <p className="text-xs text-slate-500 font-medium">Garantía directa con fabricantes</p>
                        </div>
                    </div>

                    {/* Item 2: Mayoristas Autorizados (Medalla con cinta azul/naranja) */}
                    <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:pl-6">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50/80 border border-orange-100/50 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-[#EA580C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="9" r="6" strokeWidth="2" stroke="currentColor" fill="#F59E0B" fillOpacity="0.2" />
                                <path d="M15.5 13.5L18 21l-6-3-6 3 2.5-7.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-extrabold text-sm text-slate-900">Mayoristas Autorizados</h4>
                            <p className="text-xs text-slate-500 font-medium">Distribuidores de marcas líderes</p>
                        </div>
                    </div>

                    {/* Item 3: Envíos a Nivel Nacional (Camión Naranja) */}
                    <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:pl-6">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50/80 border border-orange-100/50 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-[#EA580C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="1" y="3" width="15" height="13" rx="2" strokeWidth="2" />
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="5.5" cy="18.5" r="2.5" strokeWidth="2" />
                                <circle cx="18.5" cy="18.5" r="2.5" strokeWidth="2" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-extrabold text-sm text-slate-900">Envíos a Nivel Nacional</h4>
                            <p className="text-xs text-slate-500 font-medium">Rápidos y seguros</p>
                        </div>
                    </div>

                    {/* Item 4: Asesoría Personalizada (Auriculares / Headset Gris) */}
                    <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:pl-6">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50/80 border border-orange-100/50 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-extrabold text-sm text-slate-900">Asesoría Personalizada</h4>
                            <p className="text-xs text-slate-500 font-medium">Te ayudamos a elegir lo mejor</p>
                        </div>
                    </div>
                </div>
            </div>



            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6 space-y-8">

                {/* CATEGORÍAS (Ajustado horizontalmente en 1 sola fila de 6 columnas) */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
                            <span className="w-1.5 h-7 bg-[#EA580C] rounded-full"></span>
                            Explorar Categorías y Soluciones Empresariales
                        </h2>

                        <Link 
                            href="/categorias" 
                            className="hidden sm:inline-flex items-center gap-1.5 border border-[#EA580C] text-[#EA580C] hover:bg-orange-50 font-bold px-4 py-2 rounded-xl text-sm transition-all"
                        >
                            <span>Ver todas las categorías</span>
                            <span>&rarr;</span>
                        </Link>
                    </div>
                    <CategoryGrid categories={data?.categorias_conteo || []} />
                </section>


                {/* DESTACADOS */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-1 h-8 bg-[#F97316] rounded-full"></span>
                            Productos Destacados
                        </h2>
                        <Link href="/productos" className="text-sm font-medium text-[#F97316] hover:text-orange-700 transition-colors">Ver todos &rarr;</Link>
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
                            <span className="w-1 h-8 bg-[#F97316] rounded-full"></span>
                            Nuevos Ingresos
                        </h2>
                        <Link href="/productos" className="text-sm font-medium text-[#F97316] hover:text-orange-700 transition-colors">Ver todos &rarr;</Link>
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