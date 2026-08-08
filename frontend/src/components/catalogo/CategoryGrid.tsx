import Link from 'next/link';

interface CategoryCount {
    nombre: string;
    count: number;
    image_url?: string | null;
}

interface CategoryGridProps {
    categories: CategoryCount[];
}

const PLACEHOLDER = '/assets/category-placeholder.svg';

const DEFAULT_B2B_CATEGORIES: CategoryCount[] = [
    { nombre: "Equipos de Red", count: 120 },
    { nombre: "Seguridad y CCTV", count: 180 },
    { nombre: "Cableado Estructurado", count: 250 },
    { nombre: "Fibra Óptica", count: 150 },
    { nombre: "Racks y Canalizaciones", count: 90 },
    { nombre: "Servidores y Data Center", count: 100 },
];

export function CategoryGrid({ categories }: CategoryGridProps) {
    const listToDisplay = (categories && categories.length > 0) ? categories : DEFAULT_B2B_CATEGORIES;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
            {listToDisplay.map((cat, idx) => {
                const imgSrc = cat.image_url ?? PLACEHOLDER;
                return (
                    <Link 
                        key={idx} 
                        href={`/productos?categoria=${encodeURIComponent(cat.nombre)}`} 
                        className="group flex flex-col justify-between rounded-2xl bg-white overflow-hidden shadow-lg shadow-slate-200/80 hover:shadow-2xl hover:shadow-orange-500/20 border-2 border-slate-200/90 hover:border-[#EA580C] transition-all duration-300 hover:-translate-y-1.5 cursor-pointer ring-1 ring-black/5"
                    >
                        <div className="p-2.5 bg-slate-100/70 flex items-center justify-center border-b border-slate-200/80">
                            <div className="relative w-full h-24 sm:h-28 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center overflow-hidden group-hover:border-orange-300 transition-colors">
                                <img
                                    src={imgSrc}
                                    alt={`Categoría: ${cat.nombre}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = PLACEHOLDER;
                                    }}
                                />
                            </div>
                        </div>

                        <div className="p-3 flex items-center justify-between flex-1 w-full bg-slate-900 group-hover:bg-[#EA580C] transition-all duration-300">
                            <span className="text-xs sm:text-sm font-extrabold text-white leading-snug line-clamp-1 sm:line-clamp-2" title={cat.nombre}>
                                {cat.nombre}
                            </span>
                            <span className="text-xs font-black text-orange-400 group-hover:text-white transform group-hover:translate-x-1 transition-all ml-1.5 shrink-0">&gt;</span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}


