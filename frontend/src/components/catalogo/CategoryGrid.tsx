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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {listToDisplay.map((cat, idx) => {
                const imgSrc = cat.image_url ?? PLACEHOLDER;
                return (
                    <Link 
                        key={idx} 
                        href={`/productos?categoria=${encodeURIComponent(cat.nombre)}`} 
                        className="group flex flex-col justify-between rounded-2xl bg-white overflow-hidden shadow-xs border border-slate-200/80 hover:border-[#EA580C] hover:shadow-lg transition-all duration-300 cursor-pointer"
                    >
                        <div className="relative w-full h-32 sm:h-36 bg-slate-50/70 p-3 flex items-center justify-center overflow-hidden">
                            <img
                                src={imgSrc}
                                alt={`Categoría: ${cat.nombre}`}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = PLACEHOLDER;
                                }}
                            />
                        </div>

                        <div className="p-3.5 flex flex-col justify-between flex-1 w-full bg-white border-t border-slate-100">
                            <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#EA580C] transition-colors leading-snug line-clamp-2">
                                {cat.nombre}
                            </span>
                            
                            <div className="flex items-center justify-between w-full mt-2.5 pt-2 border-t border-slate-50 text-xs font-bold text-[#EA580C]">
                                <span>+{cat.count} productos</span>
                                <span className="text-sm font-black transform group-hover:translate-x-1 transition-transform">&gt;</span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}


