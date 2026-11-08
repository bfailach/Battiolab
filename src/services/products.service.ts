import http, { withId } from '../api/http';

export type ProductStatus = 'active' | 'inactive' | 'discontinued';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  price: number;
  priceIncludesTax: boolean;
  taxRate: number;
  unit: string;
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
  priceIncludesTax: boolean;
  taxRate: number;
  unit?: string;
  stock?: number;
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

const norm = (p: Product): Product => withId({ ...p, taxRate: p.taxRate ?? 19, unit: p.unit || 'UND', priceIncludesTax: !!p.priceIncludesTax });

type Priced = { price: number; taxRate?: number; priceIncludesTax?: boolean };

/** Precio final al público (con IVA). */
export const priceWithTax = (p: Priced) => (p.priceIncludesTax ? p.price : Math.round(p.price * (1 + (p.taxRate ?? 19) / 100)));
/** Valor unitario antes de IVA. */
export const priceBeforeTax = (p: Priced) => (p.priceIncludesTax ? Math.round(p.price / (1 + (p.taxRate ?? 19) / 100)) : p.price);

/** Desglose de una línea de venta, igual que lo calcula el servidor. */
export const lineAmounts = (p: Priced, unitPrice: number, quantity: number) => {
  const rate = p.taxRate ?? 19;
  if (p.priceIncludesTax) {
    const total = unitPrice * quantity;
    const subtotal = Math.round(total / (1 + rate / 100));
    return { subtotal, tax: total - subtotal, total };
  }
  const subtotal = unitPrice * quantity;
  const tax = Math.round((subtotal * rate) / 100);
  return { subtotal, tax, total: subtotal + tax };
};

const productsService = {
  getAll: async (category?: string): Promise<Product[]> =>
    (await http.get('/products', { params: category ? { category } : {} })).data.map(norm),
  getById: async (id: string): Promise<Product> => norm((await http.get(`/products/${id}`)).data),
  getBySku: async (sku: string): Promise<Product> =>
    norm((await http.get(`/products/sku/${encodeURIComponent(sku)}`)).data),
  create: async (data: CreateProductData): Promise<Product> => norm((await http.post('/products', data)).data),
  update: async (id: string, data: Partial<CreateProductData>): Promise<Product> =>
    norm((await http.put(`/products/${id}`, data)).data),
  delete: async (id: string): Promise<void> => {
    await http.delete(`/products/${id}`);
  },
  /** Fija el stock a un valor exacto (conteo físico). */
  updateStock: async (id: string, stock: number, note?: string): Promise<Product> =>
    norm((await http.patch(`/products/${id}/stock`, { stock, note })).data),
  /** Suma (delta > 0) o resta (delta < 0) unidades. */
  moveStock: async (id: string, delta: number, note?: string, reason?: 'scan' | 'return'): Promise<Product> =>
    norm((await http.post(`/products/${id}/stock/move`, { delta, note, reason })).data),
  /** Sube una imagen (data URL ya reducida) y devuelve la ruta para guardar en imageUrl. */
  uploadImage: async (dataUrl: string): Promise<string> => (await http.post('/uploads', { dataUrl })).data.url,
  getMovements: async (id: string): Promise<StockMovement[]> =>
    (await http.get(`/products/${id}/movements`)).data.map(withId),
  getAllMovements: async (limit = 50): Promise<StockMovement[]> =>
    (await http.get('/movements', { params: { limit } })).data
};

export default productsService;
