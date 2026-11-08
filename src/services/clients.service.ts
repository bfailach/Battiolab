import http, { withId } from '../api/http';
import { DocumentType } from '../utils/validation';

export interface Client {
  id: string;
  _id?: string;
  personType: 'natural' | 'juridica';
  name: string;
  documentType: DocumentType;
  document: string;
  checkDigit?: number;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  status: boolean;
  isFinalConsumer?: boolean;
  lastPurchase?: string | null;
  totalPurchases?: number;
  totalSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientData {
  personType: 'natural' | 'juridica';
  name: string;
  documentType: DocumentType;
  document: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  status: boolean;
}

const normalize = (c: Client): Client => withId({ ...c, documentType: c.documentType || 'CC', personType: c.personType || 'natural' });

const clientsService = {
  getAll: async (): Promise<Client[]> => (await http.get('/clients')).data.map(normalize),
  getById: async (id: string): Promise<Client> => normalize((await http.get(`/clients/${id}`)).data),
  getFinalConsumer: async (): Promise<Client> => normalize((await http.get('/clients/final-consumer')).data),
  create: async (data: CreateClientData): Promise<Client> => normalize((await http.post('/clients', data)).data),
  update: async (id: string, data: Partial<CreateClientData>): Promise<Client> =>
    normalize((await http.put(`/clients/${id}`, data)).data),
  setStatus: async (id: string, status: boolean): Promise<Client> => normalize((await http.put(`/clients/${id}`, { status })).data)
};

export default clientsService;
