import http, { withId } from '../api/http';

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

export type CreateEmployeeData = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;

const employeesService = {
  getAll: async (): Promise<Employee[]> => (await http.get('/employees')).data.map(withId),
  getById: async (id: string): Promise<Employee> => withId((await http.get(`/employees/${id}`)).data),
  create: async (data: CreateEmployeeData): Promise<Employee> => withId((await http.post('/employees', data)).data),
  update: async (id: string, data: Partial<CreateEmployeeData>): Promise<Employee> =>
    withId((await http.put(`/employees/${id}`, data)).data),
  delete: async (id: string): Promise<void> => {
    await http.delete(`/employees/${id}`);
  }
};

export default employeesService;
