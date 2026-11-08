import http from '../api/http';

export interface Lot {
  id: string;
  product: { id: string; name: string; sku: string; category?: string };
  lotNumber: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  receivedAt: string;
  warrantyUntil: string | null;
  notes: string;
  createdBy?: string;
  createdAt: string;
}

export interface CreateLotData {
  productId: string;
  lotNumber: string;
  quantity: number;
  unitCost?: number;
  supplier?: string;
  receivedAt?: string;
  warrantyUntil?: string;
  notes?: string;
}

const lotsService = {
  getAll: async (productId?: string): Promise<Lot[]> =>
    (await http.get('/lots', { params: productId ? { productId } : {} })).data,
  create: async (data: CreateLotData): Promise<Lot> => (await http.post('/lots', data)).data,
  update: async (id: string, data: Partial<CreateLotData>): Promise<Lot> => (await http.put(`/lots/${id}`, data)).data,
  delete: async (id: string): Promise<void> => {
    await http.delete(`/lots/${id}`);
  }
};

export default lotsService;
