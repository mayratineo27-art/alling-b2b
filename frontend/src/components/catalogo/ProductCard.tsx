'use client';

import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";

export interface Product {
    id: string;
    name: string;
    stock_display: string;
    price_public: number;
    category?: string;
    brand?: string;
    image_url?: string;
    slug?: string;
}

interface ProductCardProps {
    product: Product;
    badge?: string;
    badgeColor?: "blue" | "green";
    showPrice?: boolean;
}

export function ProductCard({ product, badge, badgeColor = "blue", showPrice = false }: ProductCardProps) {
    const { addToCart, adding } = useCart();
    const { refresh: refreshCart, openDrawer } = useCartContext();
    const { showToast } = useToast();
    const { isCustomer } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [success, setSuccess] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const isAdding = adding === product.id;
    const isOutOfStock = product.stock_display === "Agotado";
    const isFav = isFavorite(product.id);

    const handleAdd = async () => {
        if (isOutOfStock) return;
        try {
            setLocalError(null);
            await addToCart(product.id, 1);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
            await refreshCart();
            showToast(`"${product.name}" se agregó a tu Formato Único.`, "success", [
                { label: "Seguir buscando", onClick: () => {} },
                { label: "Ver proforma", onClick: openDrawer },
            ]);
        } catch (err: any) {
            console.error(err);
            setLocalError(err.response?.data?.detail || "Error al agregar");
            setTimeout(() => setLocalError(null), 3000);
        }
    };

    const colorClasses = badgeColor === "blue"
        ? "bg-emerald-100 text-emerald-800 ring-emerald-600/20"
        : "bg-blue-100 text-blue-800 ring-blue-600/20";

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300 group-hover:scale-105 transition-transform duration-500">
                        <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                )}
                {badge && (
                    <span className={`absolute top-3 left-3 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${colorClasses}`}>
                        {badge}
                    </span>
                )}
                {isCustomer && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(product.id);
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-400 hover:text-red-500 transition-colors shadow-sm z-10 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                        aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
                    >
                        <svg 
                            className={`w-5 h-5 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                            fill={isFav ? "currentColor" : "none"} 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="flex flex-1 flex-col p-5">
                {/* Link to product detail page */}
                <a href={product.slug ? `/productos/${product.slug}` : `/productos/${product.id}`} className="hover:text-[#10B981] transition-colors">
                    <h3 className="text-base font-bold text-gray-900 line-clamp-2 min-h-[3rem]">
                        {product.name}
                    </h3>
                </a>

                <div className={`mt-auto pt-4 flex items-end border-t border-gray-100 ${showPrice ? 'justify-between' : 'justify-end'}`}>
                    {showPrice && (
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">Precio unitario</p>
                            <p className="text-lg font-extrabold text-[#10B981]">S/ {Number(product.price_public).toFixed(2)}</p>
                        </div>
                    )}
                    <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Stock</p>
                        <p className={`text-sm font-bold ${!isOutOfStock ? 'text-gray-900' : 'text-red-600'}`}>
                            {product.stock_display}
                        </p>
                    </div>
                </div>

                {localError && (
                    <p className="text-xs text-red-600 mt-2 font-medium text-center">{localError}</p>
                )}

                <button 
                    onClick={handleAdd}
                    disabled={isOutOfStock || isAdding}
                    className={`mt-4 w-full rounded-lg py-2.5 text-sm font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 ${
                        isOutOfStock 
                            ? 'bg-gray-300 cursor-not-allowed'
                            : success 
                                ? 'bg-emerald-600 focus:ring-emerald-600' 
                                : 'bg-[#10B981] hover:bg-emerald-600 focus:ring-[#10B981]'
                    }`}
                >
                    {isAdding 
                        ? 'Agregando...' 
                        : success 
                            ? '¡Agregado ✓!' 
                            : 'Agregar a Formato Único'}
                </button>
            </div>
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="rounded-2xl bg-white border border-gray-200 p-4 animate-pulse">
            <div className="aspect-[4/3] bg-gray-200 rounded-xl mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="flex justify-between mt-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
        </div>
    );
}
