"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useFavorites } from "@/context/FavoritesContext";
import { ProductCard, SkeletonCard } from "@/components/catalogo/ProductCard";
import Link from "next/link";

export default function FavoritosPage() {
  const { favoriteProducts, loading } = useFavorites();

  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mis Favoritos</h1>
            <p className="mt-1 text-sm text-gray-500">
              Guarda los productos que compras con frecuencia para agregarlos rápidamente a tu Formato Único.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))}
            </div>
          ) : favoriteProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center bg-white shadow-sm">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No tienes productos favoritos</h3>
              <p className="mt-1 text-sm text-gray-500">
                Navega por nuestro catálogo y haz clic en el icono de corazón para agregar productos aquí.
              </p>
              <div className="mt-6">
                <Link
                  href="/categorias"
                  className="inline-flex items-center rounded-xl bg-[#10B981] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors"
                >
                  Ir al catálogo
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {favoriteProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showPrice={true}
                />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
