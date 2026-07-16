import { Trash2, AlertCircle } from 'lucide-react';
import type { FormatoUnicoItem } from '../../types';

interface ItemsTableProps {
  items: FormatoUnicoItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

const ItemsTable = ({ items, onUpdateQuantity, onRemoveItem }: ItemsTableProps) => {
  return (
    <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-muted border-b border-border text-xs uppercase text-textSecondary font-semibold">
            <tr>
              <th className="px-6 py-4">SKU / Producto</th>
              <th className="px-6 py-4 text-center">Precio Unit. (S/)</th>
              <th className="px-6 py-4 text-center">Cantidad</th>
              <th className="px-6 py-4 text-right">Total (S/)</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => {
              const isConflict = item.hasStockConflict;
              const trClasses = isConflict 
                ? "bg-danger/5 hover:bg-danger/10 border-l-4 border-l-danger transition" 
                : "bg-white hover:bg-muted/50 border-l-4 border-l-transparent transition";
                
              return (
                <tr key={item.id} className={trClasses}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name}
                          className="max-w-full max-h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-textPrimary">{item.product.name}</div>
                        <div className="text-xs text-textSecondary mt-0.5">{item.product.sku}</div>
                        {isConflict && (
                          <div className="flex items-center gap-1 text-danger text-[10px] font-bold mt-1 uppercase">
                            <AlertCircle size={12} /> Stock Max: {item.product.stock}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium">
                    {item.product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-2">
                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className={`w-20 text-center border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 font-semibold ${
                          isConflict 
                            ? 'border-danger/50 bg-danger/10 text-danger focus:ring-danger' 
                            : 'border-border bg-background focus:ring-primary focus:border-primary'
                        }`}
                        min="1"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-textPrimary">
                    {(item.product.price * item.quantity).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="text-textMetadata hover:text-danger p-2 rounded-full hover:bg-danger/10 transition"
                      title="Eliminar ítem"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-textSecondary">
                  Tu Formato Único está vacío.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsTable;
