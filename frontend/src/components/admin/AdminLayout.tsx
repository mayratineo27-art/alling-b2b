"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  {
    label: "Usuarios",
    href: "/admin/usuarios",
    svg: (
      <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: "Catálogo",
    href: "/admin/productos",
    svg: (
      <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: "Kits",
    href: "/admin/kits",
    svg: (
      <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    label: "Pedidos",
    href: "/admin/pedidos",
    svg: (
      <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
      </svg>
    ),
  },
  {
    label: "Consultas",
    href: "/admin/consultas",
    svg: (
      <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: "Cotizaciones",
    href: "/admin/cotizaciones",
    svg: (
      <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Métricas",
    href: "/admin/metricas",
    svg: (
      <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6m-6 0H5a2 2 0 01-2-2V9a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4" />
      </svg>
    ),
  },
  {
    label: "Configuración",
    href: "/admin/configuracion",
    svg: (
      <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans antialiased text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-[#061D17] via-[#041511] to-[#020A08] flex flex-col fixed inset-y-0 left-0 z-20 border-r border-emerald-950/60 shadow-2xl">
        {/* Brand Header */}
        <div className="h-20 flex items-center gap-3.5 px-6 border-b border-emerald-950/60">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/95 p-1.5 border border-emerald-800/40 flex items-center justify-center shadow-sm">
            <Image src="/alling-logo.png" alt="Alling" width={42} height={42} className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white font-extrabold text-lg tracking-tight block leading-none font-sans">Alling B2B</span>
            <span className="text-[0.65rem] uppercase font-bold tracking-[0.22em] text-emerald-400 mt-1 block">PANEL ADMIN</span>
          </div>
        </div>


        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ label, href, svg }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium tracking-[0.025em] transition-all duration-200 ease-out relative ${
                  active
                    ? "bg-emerald-500/10 text-white font-medium shadow-xs border-l-2 border-emerald-400 backdrop-blur-xs"
                    : "text-emerald-100/60 hover:text-white hover:bg-emerald-950/40 font-medium"
                }`}
              >
                <span className={active ? "text-emerald-400" : "text-emerald-200/50"}>{svg}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-emerald-950/60 bg-emerald-950/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-medium text-xs shrink-0 shadow-xs">
                {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#041511] absolute -bottom-0.5 -right-0.5 shadow-xs"></span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-[0.7rem] font-normal text-emerald-100/50 font-mono truncate">{user?.email ?? "admin@alling.com"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-normal text-emerald-100/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 border border-emerald-900/40"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}


