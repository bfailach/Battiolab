import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/products`;

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: 'Scooters' | 'Motos' | 'Baterías' | 'Repuestos';
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  category: 'Scooters' | 'Motos' | 'Baterías' | 'Repuestos';
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  status?: 'active' | 'inactive' | 'discontinued';
}

export interface UpdateProductData extends Partial<CreateProductData> {}

class ProductsService {
  private transformProduct(data: any): Product {
    return {
      id: data._id,
      name: data.name,
      sku: data.sku,
      category: data.category,
      description: data.description,
      price: data.price,
      stock: data.stock,
      minStock: data.minStock,
      imageUrl: data.imageUrl,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  async getAll(category?: string): Promise<Product[]> {
    try {
      const params = category ? { category } : {};
      const response = await axios.get(API_URL, { params });
      return response.data.map(this.transformProduct);
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async getById(id: string): Promise<Product> {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return this.transformProduct(response.data);
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async create(data: CreateProductData): Promise<Product> {
    try {
      const response = await axios.post(API_URL, data);
      return this.transformProduct(response.data);
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    if (!id) {
      throw new Error('Se requiere un ID válido para actualizar el producto');
    }
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return this.transformProduct(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar el producto');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async updateStock(id: string, stock: number): Promise<Product> {
    if (!id) {
      throw new Error('Se requiere un ID válido para actualizar el stock');
    }
    try {
      const response = await axios.patch(`${API_URL}/${id}/stock`, { stock });
      return this.transformProduct(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar el stock');
    }
  }

  private handleError(error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error en la solicitud');
    }
    throw error;
  }
}

export default new ProductsService();
