import http from '../api/http';

export type SaleStatus = 'completed' | 'pending' | 'cancelled';

export interface SaleItem {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  number?: string | null;
  client: { id: string | null; name: string; email?: string; phone?: string };
  items: SaleItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMethod?: string | null;
  notes?: string;
  status: SaleStatus;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleData {
  client: { id: string };
  items: { productId: string; quantity: number; price?: number }[];
  status: SaleStatus;
  paymentMethod?: string;
  notes?: string;
  taxRate?: number;
}

export const saleStatusLabel: Record<SaleStatus, string> = {
  completed: 'Completada',
  pending: 'Pendiente',
  cancelled: 'Anulada'
};

const salesService = {
  getAll: async (params?: { clientId?: string; status?: SaleStatus }): Promise<Sale[]> =>
    (await http.get('/sales', { params })).data,
  getById: async (id: string): Promise<Sale> => (await http.get(`/sales/${id}`)).data,
  create: async (data: CreateSaleData): Promise<Sale> => (await http.post('/sales', data)).data,
  update: async (id: string, data: Partial<CreateSaleData>): Promise<Sale> => (await http.put(`/sales/${id}`, data)).data,
  delete: async (id: string): Promise<void> => {
    await http.delete(`/sales/${id}`);
  }
};

export default salesService;
