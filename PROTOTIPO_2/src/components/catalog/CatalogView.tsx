import SidebarFilters from './SidebarFilters';
import ProductCard from './ProductCard';
import HeroCategoryGrid from '../landing/HeroCategoryGrid';
import type { Product } from '../../types';
import { ChevronRight, X } from 'lucide-react';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'SIG-UTP6-305',
    name: 'Cable UTP Cat6 305m 100% Cobre',
    brand: 'Sigma',
    category: 'Cable UTP',
    price: 450.00,
    stock: 25,
    stockStatus: 'in_stock',
    imageUrl: 'https://via.placeholder.com/200?text=Cable+UTP+Cat6'
  },
  {
    id: '2',
    sku: 'CIS-SW24-GB',
    name: 'Switch 24 puertos Gigabit PoE',
    brand: 'Cisco',
    category: 'Switches',
    price: 1250.00,
    stock: 3,
    stockStatus: 'low_stock',
    imageUrl: 'https://via.placeholder.com/200?text=Switch+Cisco'
  },
  {
    id: '3',
    sku: '3M-RJ45-C6',
    name: 'Conector RJ45 Cat6 (caja 100u)',
    brand: '3M',
    category: 'Conectores',
    price: 89.00,
    stock: 0,
    stockStatus: 'out_of_stock',
    imageUrl: 'https://via.placeholder.com/200?text=Conector+RJ45'
  },
  {
    id: '4',
    sku: 'COR-FO-9125',
    name: 'Fibra Óptica Monomodo 9/125 1000m',
    brand: 'Corning',
    category: 'Fibra Óptica',
    price: 890.00,
    stock: 8,
    stockStatus: 'in_stock',
    imageUrl: 'https://via.placeholder.com/200?text=Fibra+Optica'
  }
];

const CatalogView = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      
      {/* Nuevo Componente: Hero & Category Grid (Antes del Catálogo) */}
      <HeroCategoryGrid />

      {/* Contenedor del Catálogo (Layout 25% / 75%) */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Izquierdo - 25% */}
        <div className="w-full lg:w-1/4 flex-shrink-0">
          <SidebarFilters />
        </div>
        
        {/* Grid de Productos - 75% */}
        <section className="w-full lg:w-3/4">
          
          {/* Header Listado */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
            
            <nav className="flex items-center text-sm text-gray-500 font-medium">
              <span className="text-gray-800">Todos los productos</span>
              <ChevronRight size={14} className="mx-2" />
              <span className="text-primary font-bold">145 Resultados</span>
            </nav>
            
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 font-bold">Ordenar por:</label>
              <select className="border border-border rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50 text-gray-800 cursor-pointer">
                <option>Relevancia</option>
                <option>Menor Precio</option>
                <option>Mayor Precio</option>
              </select>
            </div>
          </div>

          {/* Chips Filtros Activos */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-sm">
              Categoría: Cable UTP
              <button className="hover:bg-primary-hover rounded-full p-0.5 transition">
                <X size={12} />
              </button>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-sm">
              Marca: Sigma
              <button className="hover:bg-primary-hover rounded-full p-0.5 transition">
                <X size={12} />
              </button>
            </span>
          </div>

          {/* Grid de Productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {MOCK_PRODUCTS.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Paginación */}
          <div className="flex justify-center items-center gap-2">
            <button className="px-4 py-2 border border-border rounded-lg bg-white hover:bg-gray-50 text-gray-500 font-bold disabled:opacity-50 transition" disabled>
              Anterior
            </button>
            <button className="w-10 h-10 border border-primary bg-primary text-white rounded-lg font-extrabold shadow-md">
              1
            </button>
            <button className="w-10 h-10 border border-border bg-white hover:bg-gray-50 text-gray-800 rounded-lg font-bold transition">
              2
            </button>
            <button className="w-10 h-10 border border-border bg-white hover:bg-gray-50 text-gray-800 rounded-lg font-bold transition">
              3
            </button>
            <button className="px-4 py-2 border border-border rounded-lg bg-white hover:bg-gray-50 text-gray-800 font-bold transition">
              Siguiente
            </button>
          </div>

        </section>
      </div>
    </div>
  );
};

export default CatalogView;
