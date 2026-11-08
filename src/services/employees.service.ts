import http, { withId } from '../api/http';
import { DocumentType } from '../utils/validation';

export interface Employee {
  id: string;
  name: string;
  documentType: DocumentType;
  document?: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: boolean;
  hireDate: string;
  terminationDate?: string | null;
  terminationReason?: string;
  salary: number;
  belowMinimumWage?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeData {
  name: string;
  documentType: DocumentType;
  document: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: boolean;
  hireDate: string;
  salary: number;
}

const normalize = (e: Employee): Employee => withId({ ...e, documentType: e.documentType || 'CC' });

const employeesService = {
  getAll: async (): Promise<Employee[]> => (await http.get('/employees')).data.map(normalize),
  getById: async (id: string): Promise<Employee> => normalize((await http.get(`/employees/${id}`)).data),
  create: async (data: CreateEmployeeData): Promise<Employee> => normalize((await http.post('/employees', data)).data),
  update: async (id: string, data: Partial<CreateEmployeeData>): Promise<Employee> =>
    normalize((await http.put(`/employees/${id}`, data)).data),
  terminate: async (id: string, date: string, reason: string): Promise<Employee> =>
    normalize((await http.post(`/employees/${id}/terminate`, { date, reason })).data)
};

export default employeesService;
