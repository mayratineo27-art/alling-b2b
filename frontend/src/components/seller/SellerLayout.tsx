"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";

const NAV_ITEMS = [
  { label: "Stock",        href: "/vendedor/stock",        icon: "📦" },
  { label: "Pedidos",      href: "/vendedor/pedidos",       icon: "🚚" },
  { label: "Consultas",    href: "/vendedor/consultas",     icon: "💬" },
  { label: "Cotizaciones", href: "/vendedor/cotizaciones",  icon: "📋" },
];

export default function SellerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 bg-[var(--alling-text)] flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-gray-700">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
            <Image src="/alling-logo.png" alt="Alling" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Alling Seller</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--alling-primary)] text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2 truncate">{user?.email ?? "seller"}</p>
          <button onClick={logout}
            className="w-full text-left text-xs text-gray-400 hover:text-red-400 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-60 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
