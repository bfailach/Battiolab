import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/employees`;

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: boolean;
  hireDate: string;
  salary: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeData {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: boolean;
  hireDate: string;
  salary: number;
}

export type UpdateEmployeeData = Partial<CreateEmployeeData>;

class EmployeesService {
  private transformEmployee(data: any): Employee {
    return {
      id: data._id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      department: data.department,
      status: data.status,
      hireDate: data.hireDate,
      salary: data.salary,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  async getAll(): Promise<Employee[]> {
    try {
      const response = await axios.get(API_URL);
      return response.data.map((employee: any) => this.transformEmployee(employee));
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async getById(id: string): Promise<Employee> {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return this.transformEmployee(response.data);
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async create(data: CreateEmployeeData): Promise<Employee> {
    try {
      const response = await axios.post(API_URL, data);
      return this.transformEmployee(response.data);
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async update(id: string, data: UpdateEmployeeData): Promise<Employee> {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return this.transformEmployee(response.data);
    } catch (error: any) {
      this.handleError(error);
      throw error;
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

  private handleError(error: any): void {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error en el servidor');
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servidor');
    } else {
      throw new Error('Error al procesar la solicitud');
    }
  }
}

export default new EmployeesService();
