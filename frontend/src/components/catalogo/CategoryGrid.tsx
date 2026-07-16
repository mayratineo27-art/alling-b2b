import Link from 'next/link';

interface CategoryCount {
    nombre: string;
    count: number;
}

interface CategoryGridProps {
    categories: CategoryCount[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
    if (!categories || categories.length === 0) {
        return (
            <div className="bg-gray-100 rounded-xl p-8 text-center text-gray-500 border-dashed border-2 border-gray-300">
                Las categorías se cargarán cuando conectes el endpoint /productos/landing
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat, idx) => (
                <Link 
                    key={idx} 
                    href={`/productos?categoria=${encodeURIComponent(cat.nombre)}`} 
                    className="group flex flex-col items-center justify-center rounded-xl bg-white p-6 shadow-sm border border-gray-100 hover:border-[#10B981] hover:shadow-md transition-all cursor-pointer"
                >
                    <span className="text-base font-semibold text-gray-800 text-center group-hover:text-[#10B981] transition-colors">
                        {cat.nombre}
                    </span>
                    <span className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        {cat.count} productos
                    </span>
                </Link>
            ))}
        </div>
    );
}
