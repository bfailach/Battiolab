import http, { withId } from '../api/http';

export interface Client {
  id: string;
  _id?: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  status: boolean;
  lastPurchase?: string | null;
  totalPurchases?: number;
  totalSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  name: string;
  document: string;
  email: string;
  phone: string;
  status: boolean;
}

const clientsService = {
  getAll: async (): Promise<Client[]> => (await http.get('/clients')).data.map(withId),
  getById: async (id: string): Promise<Client> => withId((await http.get(`/clients/${id}`)).data),
  create: async (data: CreateClientData): Promise<Client> => withId((await http.post('/clients', data)).data),
  update: async (id: string, data: Partial<CreateClientData>): Promise<Client> =>
    withId((await http.put(`/clients/${id}`, data)).data),
  delete: async (id: string): Promise<void> => {
    await http.delete(`/clients/${id}`);
  }
};

export default clientsService;
