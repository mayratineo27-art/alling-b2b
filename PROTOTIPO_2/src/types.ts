export type ProductStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  stockStatus: ProductStockStatus;
  imageUrl: string;
}

export type FsmState = 'BORRADOR' | 'COTIZACION' | 'PEDIDO' | 'CONSULTA';

export interface FormatoUnicoItem {
  id: string;
  product: Product;
  quantity: number;
  hasStockConflict: boolean;
}
