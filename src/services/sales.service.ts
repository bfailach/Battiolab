import http from '../api/http';

export type SaleStatus = 'completed' | 'pending' | 'cancelled';
export type PaymentForm = 'contado' | 'credito';

export interface SaleItem {
  productId: string;
  productName?: string;
  sku?: string;
  unit?: string;
  quantity: number;
  price: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface CustomerSnapshot {
  name: string;
  documentType?: string;
  document?: string;
  checkDigit?: number;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
}

export interface Sale {
  id: string;
  number?: string | null;
  client: { id: string | null; name: string; email?: string; phone?: string };
  customer: CustomerSnapshot;
  items: SaleItem[];
  subtotal: number;
  taxes: { rate: number; base: number; amount: number }[];
  taxAmount: number;
  total: number;
  paymentForm: PaymentForm;
  paymentMethod?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  notes?: string;
  status: SaleStatus;
  creditNote?: { number: string; date: string; reason: string; user?: string } | null;
  date: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleData {
  client: { id: string };
  items: { productId: string; quantity: number; price?: number }[];
  paymentForm: PaymentForm;
  paymentMethod?: string;
  creditDays?: number;
  notes?: string;
}

export const saleStatusLabel: Record<SaleStatus, string> = {
  completed: 'Pagada',
  pending: 'Por cobrar',
  cancelled: 'Anulada'
};

export const isOverdue = (s: Sale) => s.status === 'pending' && !!s.dueDate && new Date(s.dueDate) < new Date();

const salesService = {
  getAll: async (params?: { clientId?: string; status?: SaleStatus }): Promise<Sale[]> =>
    (await http.get('/sales', { params })).data,
  getById: async (id: string): Promise<Sale> => (await http.get(`/sales/${id}`)).data,
  create: async (data: CreateSaleData): Promise<Sale> => (await http.post('/sales', data)).data,
  updateNotes: async (id: string, notes: string): Promise<Sale> => (await http.put(`/sales/${id}`, { notes })).data,
  pay: async (id: string, paymentMethod: string): Promise<Sale> => (await http.post(`/sales/${id}/pay`, { paymentMethod })).data,
  cancel: async (id: string, reason: string): Promise<Sale> => (await http.post(`/sales/${id}/cancel`, { reason })).data
};

export default salesService;
