import { ShoppingCart, CheckCircle2, AlertTriangle, XCircle, Send } from 'lucide-react';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const isOutOfStock = product.stockStatus === 'out_of_stock';

  const getStockBadge = () => {
    switch (product.stockStatus) {
      case 'in_stock':
        return (
          <span className="absolute top-3 left-3 bg-success text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm flex items-center gap-1.5 z-10">
            <CheckCircle2 size={14} />
            En Stock
          </span>
        );
      case 'low_stock':
        return (
          <span className="absolute top-3 left-3 bg-warning text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm flex items-center gap-1.5 z-10">
            <AlertTriangle size={14} />
            Últimas unidades
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="absolute top-3 left-3 bg-danger text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm flex items-center gap-1.5 z-10">
            <XCircle size={14} />
            Agotado
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-lg transition flex flex-col h-full">
      {/* Imagen y Badge */}
      <div className="relative aspect-square bg-muted flex items-center justify-center p-6">
        {getStockBadge()}
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className={`max-w-full max-h-full object-contain ${isOutOfStock ? 'filter grayscale opacity-50' : ''}`} 
        />
      </div>
      
      {/* Info del Producto */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{product.brand}</span>
          <span className="text-[11px] text-gray-400 font-medium font-mono">{product.sku}</span>
        </div>
        
        <h3 className="font-bold text-gray-800 leading-tight mb-3 hover:text-primary transition line-clamp-2 cursor-pointer">
          {product.name}
        </h3>
        
        <div className="mt-auto pt-4 border-t border-dashed border-gray-100">
          <p className="text-2xl font-extrabold text-primary">
            S/ {product.price.toFixed(2)}
          </p>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5">
            Precio Unitario sin IGV
          </span>
        </div>
      </div>

      {/* Área de Acciones (Core Requirement) */}
      <div className="p-5 pt-0 mt-auto flex flex-col gap-2">
        {isOutOfStock ? (
          <>
            <button 
              disabled
              className="w-full flex justify-center items-center gap-2 font-bold py-2.5 rounded-lg bg-gray-200 text-gray-400 cursor-not-allowed opacity-50 transition"
            >
              <XCircle size={18} />
              Agotado
            </button>
            <button className="w-full flex justify-center items-center gap-2 font-bold py-2 rounded-lg border-2 border-[#229ED9] text-[#229ED9] hover:bg-[#229ED9]/10 transition text-sm">
              <Send size={16} />
              Consultar disponibilidad técnica
            </button>
          </>
        ) : (
          <button 
            className="w-full flex justify-center items-center gap-2 font-bold py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <ShoppingCart size={18} />
            Agregar al Formato
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
