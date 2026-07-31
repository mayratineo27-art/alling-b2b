"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import apiClient from "@/lib/api";
import NotificationBadge from "./NotificationBadge";
import CartBadge from "./CartBadge";
import { getShortName, getInitials } from "@/lib/user";


interface CategoryOption {
  id: string;
  name: string;
  icon?: string;
}

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const isCustomer = user?.role === "CUSTOMER";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get("/categorias");
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error("Error al cargar categorías en buscador:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const cat = selectedCategory.trim();

    if (!query && !cat) {
      window.location.href = "/productos";
      return;
    }

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (cat) params.set("categoria", cat);

    window.location.href = `/productos?${params.toString()}`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--alling-border)] shadow-sm">
      {/* Block 1: Logo / Search / Icons */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
          <Image
            src="/alling-logo.png"
            alt="Alling"
            width={36}
            height={36}
            className="w-9 h-9 rounded-lg object-cover shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105"
            priority
          />
          <span className="font-bold text-[var(--alling-text)] text-lg hidden sm:block">Alling</span>
        </Link>

        {/* Search with Category Select */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto">
          <div className="relative flex items-center border border-[var(--alling-border)] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[var(--alling-primary)] focus-within:border-transparent bg-white shadow-xs">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50 border-r border-[var(--alling-border)] outline-none hover:bg-gray-100 cursor-pointer max-w-[130px] sm:max-w-[170px] truncate"
              aria-label="Seleccionar categoría de búsqueda"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por producto, SKU o marca..."
              className="flex-1 min-w-0 px-3 py-2 text-sm text-[var(--alling-text)] outline-none bg-transparent"
              aria-label="Buscar productos"
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--alling-primary)] text-white text-sm font-semibold hover:bg-[var(--alling-primary-hover)] transition-colors flex items-center gap-1.5 shrink-0"
              aria-label="Buscar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </form>


        {/* Icons right */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Notifications — only authenticated */}
          {isAuthenticated && <NotificationBadge />}

          {/* Favorites — only CUSTOMER */}
          {isCustomer && (
            <Link
              href="/favoritos"
              className="p-2 text-[var(--alling-metadata)] hover:text-[var(--alling-primary)] transition-colors rounded-md hover:bg-gray-50"
              aria-label="Mis favoritos"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
          )}

          {/* Cart */}
          <CartBadge />

          {/* Account */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:flex w-7 h-7 rounded-full bg-[var(--alling-primary)]/10 text-[var(--alling-primary)] items-center justify-center text-xs font-semibold">
                {getInitials(user?.name)}
              </span>
              <span className="hidden md:block text-sm text-[var(--alling-text)] font-medium truncate max-w-[120px]">
                {getShortName(user?.name, (user as { email?: string } | null)?.email ?? "Mi cuenta")}
              </span>
              <button
                onClick={logout}
                className="text-xs text-[var(--alling-metadata)] hover:text-[var(--alling-danger)] transition-colors"
                aria-label="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-medium text-[var(--alling-primary)] hover:text-[var(--alling-primary-hover)] transition-colors"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>

      {/* Block 2: Nav menu (v1.8.0 - Formato Único navigation active) */}
      <nav className="border-t border-[var(--alling-border)] bg-white" aria-label="Menú principal">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-0 text-sm font-medium" role="list">
            {[
              { label: "HOME", href: "/" },
              { label: "FORMATO ÚNICO", href: "/formatos" },
              { label: "CATÁLOGO", href: "/categorias" },
              { label: "KITS", href: "/kits" },
              { label: "NOSOTROS", href: "/nosotros" },
            ].map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block px-4 py-3 text-[var(--alling-text)] hover:text-[var(--alling-primary)] hover:border-b-2 hover:border-[var(--alling-primary)] transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
