import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface Client {
  id?: string;  // Hacemos id opcional ya que usaremos _id
  _id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  status: boolean;
  lastPurchase?: string;
  totalPurchases?: number;
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

export interface UpdateClientData extends Partial<CreateClientData> {}

const clientsService = {
  getAll: async (): Promise<Client[]> => {
    const response = await axios.get(`${API_BASE_URL}/clients`);
    return response.data;
  },

  getById: async (id: string): Promise<Client> => {
    const response = await axios.get(`${API_BASE_URL}/clients/${id}`);
    return response.data;
  },
  
create: async (data: CreateClientData): Promise<Client> => {
  try {
    // Create an explicit object with all required fields to ensure they're included
    const clientData = {
      name: data.name,
      document: data.document,
      email: data.email,
      phone: data.phone,
      status: data.status ?? true
    };
    
    console.log('Sending client data:', clientData);
    
    // Use simple axios config without custom serialization
    const response = await axios.post(`${API_BASE_URL}/clients`, clientData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error completo:', error.response?.data);
    }
    throw error;
  }
},

  update: async (id: string, data: UpdateClientData): Promise<Client> => {
    const response = await axios.put(`${API_BASE_URL}/clients/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/clients/${id}`);
  }
};

export default clientsService;
