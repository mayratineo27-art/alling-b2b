/**
 * HeroCategoryGrid — CMP-CAT-023 (Hero) + CMP-CAT-025 (Tarjetas de categoría)
 *
 * RF-CAT-004 (Landing) / RF-CAT-005 (Grid categorías) / RF-CAT-009 (imagen)
 * RN-CAT-IMG-04: si image_url = null → placeholder SVG; nunca URL rota.
 */

import { Server, Cable, Wifi, HardDrive } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const PLACEHOLDER = '/assets/category-placeholder.svg';

interface CategoryItem {
  id: string;
  name: string;
  count: number;
  icon: LucideIcon;
  /** URL pública de la imagen de referencia (RF-CAT-009). Null → placeholder. */
  image_url: string | null;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'cat1', name: 'Cableado Estructurado', count: 145, icon: Cable,     image_url: null },
  { id: 'cat2', name: 'Fibra Óptica',          count: 89,  icon: Wifi,      image_url: null },
  { id: 'cat3', name: 'Switches',              count: 42,  icon: Server,    image_url: null },
  { id: 'cat4', name: 'Racks y Gabinetes',     count: 67,  icon: HardDrive, image_url: null },
];

const HeroCategoryGrid = () => {
  return (
    <section className="mb-8">
      {/* ── Hero Banner (RF-CAT-004 / CMP-CAT-023) ─────────────────────── */}
      <div className="w-full min-h-[300px] bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-center relative overflow-hidden rounded-xl mb-6 shadow-md">
        {/* Efecto Bokeh simulado */}
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] opacity-60" />
        <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] opacity-60" />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Infraestructura B2B para Telecomunicaciones
          </h1>
          <p className="text-gray-300 mb-8 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            El catálogo más completo de hardware corporativo en Perú con disponibilidad inmediata.
          </p>
          <button className="bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-8 rounded-lg shadow-lg transition transform hover:-translate-y-0.5 text-lg">
            Ver Catálogo Completo
          </button>
        </div>
      </div>

      {/* ── Category Grid (RF-CAT-005 / CMP-CAT-025) ───────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const imgSrc = category.image_url ?? PLACEHOLDER;

          return (
            <div
              key={category.id}
              className="bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition cursor-pointer group overflow-hidden flex flex-col"
            >
              {/* Imagen de referencia (RF-CAT-009 / RN-CAT-IMG-04) */}
              <div className="relative w-full aspect-video bg-muted overflow-hidden">
                <img
                  src={imgSrc}
                  alt={`Categoría: ${category.name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // RN-CAT-IMG-04: fallback si la URL es inválida
                    (e.target as HTMLImageElement).src = PLACEHOLDER;
                  }}
                />
                {/* Overlay degradado para legibilidad del ícono */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                {/* Ícono superpuesto (solo visible si hay imagen real) */}
                {category.image_url && (
                  <div className="absolute bottom-2 right-2 bg-white/80 rounded-full p-1.5 shadow">
                    <Icon size={14} className="text-primary" />
                  </div>
                )}
              </div>

              {/* Información de la categoría */}
              <div className="p-4 flex items-center gap-3 flex-1">
                {/* Ícono solo cuando NO hay imagen (tarjeta sin foto) */}
                {!category.image_url && (
                  <div className="bg-muted group-hover:bg-primary/10 transition p-3 rounded-full text-gray-500 group-hover:text-primary shrink-0">
                    <Icon size={22} />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm truncate">{category.name}</h3>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {category.count} productos
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HeroCategoryGrid;

