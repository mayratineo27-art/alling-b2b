import { useState } from 'react';
import FsmHeader from './FsmHeader';
import ConflictResolutionBanner from './ConflictResolutionBanner';
import ItemsTable from './ItemsTable';
import OrderSummary from './OrderSummary';
import type { FormatoUnicoItem, FsmState } from '../../types';

// Mocks realistas para el Motor Transaccional
const INITIAL_ITEMS: FormatoUnicoItem[] = [
  {
    id: 'f1',
    product: {
      id: '1',
      sku: 'SIG-UTP6-305',
      name: 'Cable UTP Cat6 305m 100% Cobre',
      brand: 'Sigma',
      category: 'Cable UTP',
      price: 450.00,
      stock: 25,
      stockStatus: 'in_stock',
      imageUrl: 'https://via.placeholder.com/200?text=Cable+UTP'
    },
    quantity: 10,
    hasStockConflict: false,
  },
  {
    id: 'f2',
    product: {
      id: '2',
      sku: 'CIS-SW24-GB',
      name: 'Switch 24 puertos Gigabit PoE',
      brand: 'Cisco',
      category: 'Switches',
      price: 1250.00,
      stock: 3,
      stockStatus: 'low_stock',
      imageUrl: 'https://via.placeholder.com/200?text=Switch'
    },
    quantity: 5, // Conflicto: pide 5, pero stock es 3
    hasStockConflict: true,
  },
  {
    id: 'f3',
    product: {
      id: '4',
      sku: 'COR-FO-9125',
      name: 'Fibra Óptica Monomodo 9/125 1000m',
      brand: 'Corning',
      category: 'Fibra Óptica',
      price: 890.00,
      stock: 8,
      stockStatus: 'in_stock',
      imageUrl: 'https://via.placeholder.com/200?text=Fibra+Optica'
    },
    quantity: 2,
    hasStockConflict: false,
  }
];

const FormatoUnicoView = () => {
  const [items, setItems] = useState<FormatoUnicoItem[]>(INITIAL_ITEMS);
  const [fsmState] = useState<FsmState>('BORRADOR');
  
  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        // Re-evaluar conflicto
        const hasConflict = newQuantity > item.product.stock;
        return { ...item, quantity: newQuantity, hasStockConflict: hasConflict };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const conflictCount = items.filter(item => item.hasStockConflict).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <FsmHeader formatId="#FU-10294" state={fsmState} />
      
      <ConflictResolutionBanner conflictCount={conflictCount} />
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <ItemsTable 
            items={items} 
            onUpdateQuantity={handleUpdateQuantity} 
            onRemoveItem={handleRemoveItem} 
          />
        </div>
        
        <aside className="w-full lg:w-[350px] flex-shrink-0">
          <OrderSummary items={items} state={fsmState} />
        </aside>
      </div>
    </div>
  );
};

export default FormatoUnicoView;
