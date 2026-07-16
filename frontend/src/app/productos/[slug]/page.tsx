'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useCart } from '@/hooks/useCart';
import { useCartContext } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { ChevronLeft, ShoppingBag, CheckCircle, ShieldAlert, Layers } from 'lucide-react';
import Link from 'next/link';

interface ProductDetail {
    id: string;
    name: string;
    stock_display: string;
    price_public: number;
    slug?: string;
    category?: string;
    brand?: string;
    image_url?: string;
    specs?: Record<string, string>;
    image_gallery?: string[];
}

interface Props {
    params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: Props) {
    const { slug } = use(params);
    const router = useRouter();
    const { addToCart, adding } = useCart();
    const { refresh: refreshCart, openDrawer } = useCartContext();
    const { showToast } = useToast();

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'desc' | 'specs'>('desc');
    const [success, setSuccess] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get(`/productos/${slug}/`);
                setProduct(res.data);
                if (res.data.image_url) {
                    setActiveImage(res.data.image_url);
                } else if (res.data.image_gallery && res.data.image_gallery.length > 0) {
                    setActiveImage(res.data.image_gallery[0]);
                }
                setError(null);
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.detail || 'No se pudo cargar la información del producto');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 border-4 border-t-[#10B981] border-gray-200 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Cargando detalles del producto...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
                    <p className="text-gray-500 mb-6">{error || 'El producto solicitado no existe o no se encuentra activo.'}</p>
                    <Link 
                        href="/productos"
                        className="inline-flex items-center justify-center bg-[#10B981] text-white px-6 py-2.5 rounded-lg shadow font-medium hover:bg-emerald-600 transition"
                    >
                        Volver al Catálogo
                    </Link>
                </div>
            </div>
        );
    }

    const images = [
        ...(product.image_url ? [product.image_url] : []),
        ...(product.image_gallery || [])
    ].filter((value, index, self) => self.indexOf(value) === index); // unique

    const isAdding = adding === product.id;
    const isOutOfStock = product.stock_display === "Agotado";

    // Helper to calculate maximum selectable stock quantity in frontend safely
    const getStockLimit = (): number => {
        if (isOutOfStock) return 0;
        if (product.stock_display === "En Stock") return 999;
        if (product.stock_display.startsWith(">")) return 999;
        if (product.stock_display === "Pocas unidades") return 10;
        
        const match = product.stock_display.match(/^(\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }
        return 999;
    };
    const stockLimit = getStockLimit();

    const handleIncrement = () => {
        if (quantity < stockLimit) {
            setQuantity(prev => prev + 1);
        }
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleAddToCart = async () => {
        if (isOutOfStock) return;
        try {
            setLocalError(null);
            await addToCart(product.id, quantity);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
            await refreshCart();
            showToast(`"${product.name}" se agregó a tu Formato Único.`, "success", [
                { label: "Seguir buscando", onClick: () => {} },
                { label: "Ver proforma", onClick: openDrawer },
            ]);
        } catch (err: any) {
            console.error(err);
            setLocalError(err.response?.data?.detail || 'Error al agregar productos');
            setTimeout(() => setLocalError(null), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Back Link */}
                <div className="mb-6">
                    <button 
                        onClick={() => router.back()}
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Atrás
                    </button>
                </div>

                {/* Details Container */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-8 lg:p-12">
                        
                        {/* LEFT: Image Gallery */}
                        <div className="flex flex-col gap-4">
                            <div className="aspect-[4/3] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center relative">
                                {activeImage ? (
                                    <img 
                                        src={activeImage} 
                                        alt={product.name} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-gray-300">
                                        <Layers className="w-24 h-24 stroke-1" />
                                    </div>
                                )}
                            </div>
                            
                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto py-2">
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImage(img)}
                                            className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${activeImage === img ? 'border-[#10B981] scale-95 shadow-sm' : 'border-gray-200 opacity-70 hover:opacity-100'}`}
                                        >
                                            <img src={img} alt={`${product.name} thumbnail ${i}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Detail & Purchase Panel */}
                        <div className="flex flex-col justify-between">
                            <div>
                                {/* Brand and Category */}
                                <div className="flex items-center gap-2 mb-3">
                                    {product.brand && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                                            {product.brand}
                                        </span>
                                    )}
                                    {product.category && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            {product.category}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
                                    {product.name}
                                </h1>

                                {/* Price block */}
                                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 mb-6 border border-gray-100 flex items-baseline justify-between">
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1 font-medium">Precio Público (Unitario)</span>
                                        <span className="text-2xl sm:text-3xl font-black text-[#10B981]">S/ {Number(product.price_public).toFixed(2)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-500 block mb-1 font-medium">Disponibilidad</span>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                            isOutOfStock ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                            {product.stock_display}
                                        </span>
                                    </div>
                                </div>

                                {/* Tabs specifications / description */}
                                <div className="border-b border-gray-200 mb-6">
                                    <nav className="-mb-px flex space-x-6">
                                        <button
                                            onClick={() => setActiveTab('desc')}
                                            className={`pb-4 px-1 border-b-2 font-bold text-sm transition-colors ${activeTab === 'desc' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Descripción
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('specs')}
                                            className={`pb-4 px-1 border-b-2 font-bold text-sm transition-colors ${activeTab === 'specs' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Especificaciones Técnicas
                                        </button>
                                    </nav>
                                </div>

                                {/* Tab Contents */}
                                <div className="min-h-[120px] text-gray-600 text-sm leading-relaxed mb-6">
                                    {activeTab === 'desc' ? (
                                        <p>{product.specs?.description || 'No hay descripción disponible para este producto.'}</p>
                                    ) : (
                                        product.specs && Object.keys(product.specs).filter(k => k !== 'description').length > 0 ? (
                                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-100">
                                                    <tbody className="bg-white divide-y divide-gray-100">
                                                        {Object.entries(product.specs)
                                                            .filter(([key]) => key !== 'description')
                                                            .map(([key, val]) => (
                                                                <tr key={key}>
                                                                    <td className="px-4 py-2.5 font-bold text-gray-500 bg-gray-50 w-1/3 capitalize">{key.replace(/_/g, ' ')}</td>
                                                                    <td className="px-4 py-2.5 text-gray-900">{val}</td>
                                                                </tr>
                                                            ))
                                                        }
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 italic">No se especificaron propiedades técnicas adicionales.</p>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Purchase Panel (Selector & Action Button) */}
                            <div className="border-t border-gray-100 pt-6 mt-auto">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                    
                                    {/* Quantity Selector */}
                                    <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2 w-full sm:w-36 bg-gray-50">
                                        <button 
                                            onClick={handleDecrement}
                                            disabled={quantity <= 1 || isOutOfStock}
                                            className="text-gray-500 hover:text-gray-900 font-black disabled:opacity-30 disabled:cursor-not-allowed select-none text-xl w-6 h-6 flex items-center justify-center font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="font-bold text-gray-900 select-none">{isOutOfStock ? 0 : quantity}</span>
                                        <button 
                                            onClick={handleIncrement}
                                            disabled={quantity >= stockLimit || isOutOfStock}
                                            className="text-gray-500 hover:text-gray-900 font-black disabled:opacity-30 disabled:cursor-not-allowed select-none text-xl w-6 h-6 flex items-center justify-center font-bold"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock || isAdding}
                                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 ${
                                            isOutOfStock
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : success
                                                    ? 'bg-emerald-600 focus:ring-emerald-600'
                                                    : 'bg-[#10B981] hover:bg-emerald-600 focus:ring-[#10B981]'
                                        }`}
                                    >
                                        {isAdding ? (
                                            <>
                                                <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                                                Agregando...
                                            </>
                                        ) : success ? (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                ¡Agregado con éxito!
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingBag className="w-5 h-5" />
                                                Agregar a Formato Único
                                            </>
                                        )}
                                    </button>
                                </div>
                                {localError && (
                                    <p className="text-sm text-red-600 mt-3 font-semibold text-center">{localError}</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
