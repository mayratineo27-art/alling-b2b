"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { getShortName, getInitials } from "@/lib/user";

interface DashboardLayoutProps {
  children: ReactNode;
}

const NAV_LINK_BASE =
  "flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-colors group";
const NAV_LINK_ACTIVE = "bg-emerald-50 text-[#10B981]";
const NAV_LINK_INACTIVE = "text-gray-700 hover:bg-emerald-50 hover:text-[#10B981]";
const NAV_ICON_ACTIVE = "text-[#10B981]";
const NAV_ICON_INACTIVE = "text-gray-400 group-hover:text-[#10B981]";

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900 font-sans">
      {/* Sidebar: sticky (no fixed) para que participe del flujo del layout y
          se desplace fuera de vista junto con este contenedor antes de llegar
          al Footer (Contacto/Información/Legal), en vez de quedar flotando
          sobre él. top-[110px] la coloca debajo del Header público sticky
          (109.6px, ver Header.tsx); self-start evita que el flex la estire. */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col sticky top-[110px] self-start h-[calc(100vh-110px)] z-10 rounded-r-xl shadow-sm">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#10B981]/10 text-sm font-semibold text-[#10B981]">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {getShortName(user?.name)}
            </p>
            <p className="text-xs text-gray-400">Mi cuenta</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <Link
            href="/cuenta/formatos"
            className={`${NAV_LINK_BASE} ${isActive("/cuenta/formatos") ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE}`}
          >
            <svg className={`w-5 h-5 mr-3 ${isActive("/cuenta/formatos") ? NAV_ICON_ACTIVE : NAV_ICON_INACTIVE}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Mis Formatos
          </Link>

          <Link
            href="/cotizaciones"
            className={`${NAV_LINK_BASE} ${isActive("/cotizaciones") ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE}`}
          >
            <svg className={`w-5 h-5 mr-3 ${isActive("/cotizaciones") ? NAV_ICON_ACTIVE : NAV_ICON_INACTIVE}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Mis Cotizaciones
          </Link>

          <Link
            href="/consultas"
            className={`${NAV_LINK_BASE} ${isActive("/consultas") ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE}`}
          >
            <svg className={`w-5 h-5 mr-3 ${isActive("/consultas") ? NAV_ICON_ACTIVE : NAV_ICON_INACTIVE}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Mis Consultas
          </Link>

          <Link
            href="/pedidos"
            className={`${NAV_LINK_BASE} ${isActive("/pedidos") ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE}`}
          >
            <svg className={`w-5 h-5 mr-3 ${isActive("/pedidos") ? NAV_ICON_ACTIVE : NAV_ICON_INACTIVE}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Historial de Pedidos
          </Link>
        </nav>

        {/* Footer del Sidebar (Opcional) */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Soporte B2B
          </div>
        </div>
      </aside>

      {/* Área de Contenido Principal */}
      <main className="flex-1 p-8 min-w-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
