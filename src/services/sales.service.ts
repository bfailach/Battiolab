import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface SaleItem {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  _id?: string; // Adding _id as optional for backend compatibility
  client: {
    id: string;
    name: string;
  };
  items: SaleItem[];
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleData {
  client: {
    id: string;
    name: string;
  };
  items: {
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
}

const salesService = {
  getAll: async (): Promise<Sale[]> => {
    const response = await axios.get(`${API_BASE_URL}/sales`);
    return response.data;
  },

  getById: async (id: string): Promise<Sale> => {
    const response = await axios.get(`${API_BASE_URL}/sales/${id}`);
    return response.data;
  },

  create: async (data: CreateSaleData): Promise<Sale> => {
    const response = await axios.post(`${API_BASE_URL}/sales`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateSaleData>): Promise<Sale> => {
    const response = await axios.put(`${API_BASE_URL}/sales/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/sales/${id}`);
  }
};

export default salesService;
