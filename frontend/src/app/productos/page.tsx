'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { ProductCard, SkeletonCard, Product } from '@/components/catalogo/ProductCard';
import { useDebounce } from '@/hooks/useDebounce';

function ProductosContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters state from URL
    const qParam = searchParams.get('q') || '';
    const categoriaParam = searchParams.get('categoria') || '';
    const marcaParam = searchParams.get('marca') || '';
    const precioMinParam = searchParams.get('precio_min') || '';
    const precioMaxParam = searchParams.get('precio_max') || '';
    const inStockParam = searchParams.get('in_stock') || '';
    const skipParam = parseInt(searchParams.get('skip') || '0', 10);
    const limitParam = parseInt(searchParams.get('limit') || '12', 10);

    // Local inputs state
    const [categoria, setCategoria] = useState(categoriaParam);
    const [marca, setMarca] = useState(marcaParam);
    const [precioMin, setPrecioMin] = useState(precioMinParam);
    const [precioMax, setPrecioMax] = useState(precioMaxParam);
    const [inStock, setInStock] = useState(inStockParam === 'true');

    // Debounce state for inputs
    const debouncedCategoria = useDebounce(categoria, 300);
    const debouncedMarca = useDebounce(marca, 300);

    // 1. Sync local input values if the URL changes externally
    useEffect(() => {
        setCategoria(categoriaParam);
        setMarca(marcaParam);
        setPrecioMin(precioMinParam);
        setPrecioMax(precioMaxParam);
        setInStock(inStockParam === 'true');
    }, [categoriaParam, marcaParam, precioMinParam, precioMaxParam, inStockParam]);

    // 2. Fetch products whenever URL parameters change
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                let response;
                if (qParam) {
                    // Full-text search (RF-CAT-003)
                    response = await apiClient.get('/productos/buscar/', { params: { q: qParam } });
                } else {
                    // Standard listing with filters (RF-CAT-001)
                    const params: any = { skip: skipParam, limit: limitParam };
                    if (categoriaParam) params.categoria = categoriaParam;
                    if (marcaParam) params.marca = marcaParam;
                    if (precioMinParam) params.precio_min = precioMinParam;
                    if (precioMaxParam) params.precio_max = precioMaxParam;
                    if (inStockParam === 'true') params.in_stock = true;

                    response = await apiClient.get('/productos/', { params });
                }
                setProducts(response.data);
                setError(null);
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.detail || 'Error al cargar productos');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [qParam, categoriaParam, marcaParam, precioMinParam, precioMaxParam, inStockParam, skipParam, limitParam]);

    // 3. Auto-sync debounced text inputs and stock checkbox back to URL
    useEffect(() => {
        const currentCategory = searchParams.get('categoria') || '';
        const currentBrand = searchParams.get('marca') || '';
        const currentInStock = searchParams.get('in_stock') === 'true';

        let changed = false;
        const params = new URLSearchParams(searchParams.toString());

        if (debouncedCategoria !== currentCategory) {
            if (debouncedCategoria) params.set('categoria', debouncedCategoria);
            else params.delete('categoria');
            changed = true;
        }

        if (debouncedMarca !== currentBrand) {
            if (debouncedMarca) params.set('marca', debouncedMarca);
            else params.delete('marca');
            changed = true;
        }

        if (inStock !== currentInStock) {
            if (inStock) params.set('in_stock', 'true');
            else params.delete('in_stock');
            changed = true;
        }

        if (changed) {
            // Clear keyword search q query if typing specific filters to prevent conflict
            params.delete('q');
            params.set('skip', '0'); // Reset pagination
            router.push(`/productos?${params.toString()}`);
        }
    }, [debouncedCategoria, debouncedMarca, inStock, searchParams, router]);

    // Manual apply function for price filters (optional button click)
    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (categoria) params.set('categoria', categoria);
        else params.delete('categoria');
        if (marca) params.set('marca', marca);
        else params.delete('marca');
        if (precioMin) params.set('precio_min', precioMin);
        else params.delete('precio_min');
        if (precioMax) params.set('precio_max', precioMax);
        else params.delete('precio_max');
        if (inStock) params.set('in_stock', 'true');
        else params.delete('in_stock');

        params.delete('q');
        params.set('skip', '0');
        router.push(`/productos?${params.toString()}`);
    };

    const clearFilters = () => {
        setCategoria('');
        setMarca('');
        setPrecioMin('');
        setPrecioMax('');
        setInStock(false);
        router.push('/productos');
    };

    const handleNextPage = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('skip', (skipParam + limitParam).toString());
        router.push(`/productos?${params.toString()}`);
    };

    const handlePrevPage = () => {
        const newSkip = Math.max(0, skipParam - limitParam);
        const params = new URLSearchParams(searchParams.toString());
        params.set('skip', newSkip.toString());
        router.push(`/productos?${params.toString()}`);
    };

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
            {/* SIDEBAR FILTERS */}
            <aside className="w-full md:w-64 shrink-0">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Filtros</h2>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                            <input 
                                type="text" 
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                                placeholder="Ej: Fibra Óptica"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                            <input 
                                type="text" 
                                value={marca}
                                onChange={(e) => setMarca(e.target.value)}
                                placeholder="Ej: Huawei"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Precio (S/)</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={precioMin}
                                    onChange={(e) => setPrecioMin(e.target.value)}
                                    placeholder="Mín"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                                />
                                <span className="text-gray-500">-</span>
                                <input 
                                    type="number" 
                                    value={precioMax}
                                    onChange={(e) => setPrecioMax(e.target.value)}
                                    placeholder="Máx"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                                />
                            </div>
                        </div>

                        {/* Availability check */}
                        <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="in_stock" 
                                checked={inStock}
                                onChange={(e) => setInStock(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-[#10B981] focus:ring-[#10B981]"
                            />
                            <label htmlFor="in_stock" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                                Solo en stock
                            </label>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                            <button 
                                onClick={applyFilters}
                                className="w-full rounded-md bg-[#10B981] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 transition-colors"
                            >
                                Aplicar Filtros
                            </button>
                            <button 
                                onClick={clearFilters}
                                className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* PRODUCT GRID */}
            <div className="flex-1">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {qParam ? `Búsqueda: "${qParam}"` : categoriaParam ? `Catálogo: ${categoriaParam}` : 'Todos los Productos'}
                    </h1>
                    <div className="text-sm text-gray-500">
                        Mostrando resultados {products.length > 0 ? skipParam + 1 : 0} - {skipParam + products.length}
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm text-center mb-6">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} showPrice={true} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100 border-dashed">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No se encontraron productos</h3>
                        <p className="text-gray-500 max-w-md text-center">Intenta ajustar los filtros de búsqueda o navegar por otras categorías para encontrar lo que necesitas.</p>
                        <button 
                            onClick={clearFilters}
                            className="mt-6 rounded-md bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                            Ver todos los productos
                        </button>
                    </div>
                )}

                {/* PAGINATION */}
                {!loading && products.length > 0 && !qParam && (
                    <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6">
                        <button 
                            onClick={handlePrevPage}
                            disabled={skipParam === 0}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${skipParam === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            &larr; Anterior
                        </button>
                        <button 
                            onClick={handleNextPage}
                            disabled={products.length < limitParam}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${products.length < limitParam ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Siguiente &rarr;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ProductosPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <Suspense fallback={
                <div className="flex items-center justify-center h-screen">
                    <div className="h-12 w-12 rounded-full border-4 border-[#10B981] border-t-transparent animate-spin"></div>
                </div>
            }>
                <ProductosContent />
            </Suspense>
        </main>
    );
}
