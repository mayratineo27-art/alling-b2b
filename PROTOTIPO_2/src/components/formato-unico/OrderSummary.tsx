import { CreditCard, FileText, Trash } from 'lucide-react';
import type { FormatoUnicoItem, FsmState } from '../../types';

interface OrderSummaryProps {
  items: FormatoUnicoItem[];
  state: FsmState;
}

const OrderSummary = ({ items, state }: OrderSummaryProps) => {
  const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;
  
  const hasConflict = items.some(item => item.hasStockConflict);

  return (
    <div className="bg-white rounded-xl p-6 border border-border shadow-sm sticky top-24">
      <h2 className="font-bold text-textPrimary text-lg mb-6 border-b border-border pb-4">Resumen del Formato</h2>
      
      <div className="space-y-3 text-sm mb-6">
        <div className="flex justify-between items-center text-textSecondary">
          <span>Subtotal (Sin IGV)</span>
          <span className="font-semibold text-textPrimary">S/ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-textSecondary">
          <span>IGV (18%)</span>
          <span className="font-semibold text-textPrimary">S/ {igv.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-textSecondary pt-3 border-t border-dashed border-border">
          <span className="font-bold text-base text-textPrimary">Total a Pagar</span>
          <span className="font-bold text-xl text-primary">S/ {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          disabled={hasConflict || items.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CreditCard size={18} />
          {state === 'COTIZACION' ? 'Pagar Cotización' : 'Ir al Checkout'}
        </button>
        
        <button 
          disabled={items.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary hover:bg-primary/5 font-bold py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText size={18} />
          Generar Cotización (PDF)
        </button>
        
        <button 
          disabled={items.length === 0}
          className="w-full flex items-center justify-center gap-2 text-textSecondary hover:text-danger font-semibold py-2 px-4 rounded-lg transition text-sm"
        >
          <Trash size={16} />
          Vaciar Formato
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
