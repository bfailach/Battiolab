import http, { withId } from '../api/http';

export type ProductStatus = 'active' | 'inactive' | 'discontinued';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  category: string;
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  status?: ProductStatus;
}

export interface StockMovement {
  id: string;
  _id?: string;
  product?: { id: string; name: string; sku: string } | null;
  type: 'in' | 'out' | 'adjust';
  quantity: number;
  stockAfter: number;
  reason: 'sale' | 'sale_cancelled' | 'lot' | 'scan' | 'manual' | 'return';
  reference?: string;
  note?: string;
  user?: string;
  createdAt: string;
}

export const movementReasonLabel: Record<StockMovement['reason'], string> = {
  sale: 'Venta',
  sale_cancelled: 'Venta anulada',
  lot: 'Ingreso de lote',
  scan: 'Escáner',
  manual: 'Ajuste manual',
  return: 'Devolución'
};

const productsService = {
  getAll: async (category?: string): Promise<Product[]> =>
    (await http.get('/products', { params: category ? { category } : {} })).data.map(withId),
  getById: async (id: string): Promise<Product> => withId((await http.get(`/products/${id}`)).data),
  getBySku: async (sku: string): Promise<Product> =>
    withId((await http.get(`/products/sku/${encodeURIComponent(sku)}`)).data),
  create: async (data: CreateProductData): Promise<Product> => withId((await http.post('/products', data)).data),
  update: async (id: string, data: Partial<CreateProductData>): Promise<Product> =>
    withId((await http.put(`/products/${id}`, data)).data),
  delete: async (id: string): Promise<void> => {
    await http.delete(`/products/${id}`);
  },
  /** Fija el stock a un valor exacto (conteo físico). */
  updateStock: async (id: string, stock: number, note?: string): Promise<Product> =>
    withId((await http.patch(`/products/${id}/stock`, { stock, note })).data),
  /** Suma (delta > 0) o resta (delta < 0) unidades. */
  moveStock: async (id: string, delta: number, note?: string, reason?: 'scan' | 'return'): Promise<Product> =>
    withId((await http.post(`/products/${id}/stock/move`, { delta, note, reason })).data),
  getMovements: async (id: string): Promise<StockMovement[]> =>
    (await http.get(`/products/${id}/movements`)).data.map(withId),
  getAllMovements: async (limit = 50): Promise<StockMovement[]> =>
    (await http.get('/movements', { params: { limit } })).data
};

export default productsService;
