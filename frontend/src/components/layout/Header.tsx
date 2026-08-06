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
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--alling-border)] shadow-md">
      {/* Block 1: Logo / Search / Icons */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between gap-6">
        {/* Logo Agrandado */}
        <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
          <Image
            src="/alling-logo.png"
            alt="Alling B2B"
            width={48}
            height={48}
            className="w-12 h-12 rounded-xl object-cover shadow-xs ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105"
            priority
          />
          <div className="hidden sm:flex flex-col">
            <span className="font-extrabold text-[var(--alling-text)] text-2xl tracking-tight leading-none">Alling</span>
            <span className="text-[0.65rem] font-bold text-orange-500 tracking-[0.18em] uppercase mt-0.5">B2B Portal</span>
          </div>
        </Link>

        {/* Search with Category Select */}
        <form onSubmit={handleSearch} className="flex-1 max-w-3xl mx-auto">
          <div className="relative flex items-center border-2 border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#F97316] focus-within:border-transparent bg-white shadow-xs transition-all">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-50 border-r border-slate-200 outline-none hover:bg-slate-100 cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
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
              className="flex-1 min-w-0 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none bg-transparent"
              aria-label="Buscar productos"
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#F97316] hover:bg-orange-600 text-white text-sm font-bold transition-colors flex items-center gap-2 shrink-0 shadow-xs"
              aria-label="Buscar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </form>

        {/* Icons right */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Notifications — only authenticated */}
          {isAuthenticated && <NotificationBadge />}

          {/* Favorites — only CUSTOMER */}
          {isCustomer && (
            <Link
              href="/favoritos"
              className="p-2.5 text-slate-600 hover:text-[#F97316] transition-colors rounded-lg hover:bg-slate-50"
              aria-label="Mis favoritos"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
          )}

          {/* Cart */}
          <CartBadge />

          {/* Account */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="w-8 h-8 rounded-full bg-[#F97316]/15 text-[#F97316] flex items-center justify-center text-xs font-bold ring-2 ring-[#F97316]/30">
                {getInitials(user?.name)}
              </span>
              <span className="hidden md:block text-sm text-slate-800 font-bold truncate max-w-[130px]">
                {getShortName(user?.name, (user as { email?: string } | null)?.email ?? "Mi cuenta")}
              </span>
              <button
                onClick={logout}
                className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors ml-1 px-1.5 py-1 rounded-md hover:bg-red-50"
                aria-label="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-bold bg-[#EA580C] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl transition-all shadow-xs"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>

      {/* Block 2: Nav menu */}
      <nav className="border-t border-slate-100 bg-white" aria-label="Menú principal">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between">

          <ul className="flex items-center gap-1 text-sm font-extrabold" role="list">
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
                  className="block px-5 py-3.5 text-slate-700 hover:text-[#EA580C] hover:border-b-2 hover:border-[#EA580C] transition-all tracking-wider text-xs sm:text-sm"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Special Nav Items Right */}
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-700">
            <Link href="/productos?q=novedades" className="flex items-center gap-2 hover:text-[#EA580C] transition-colors">
              <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" stroke="currentColor" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 14h2m4 0h2m-6 3h2" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Novedades</span>
            </Link>
            <Link href="/productos?q=ofertas" className="flex items-center gap-2 hover:text-[#EA580C] transition-colors">
              <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Ofertas</span>
            </Link>
          </div>

        </div>
      </nav>


    </header>
  );
}

