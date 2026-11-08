import http from '../api/http';
import { SaleStatus } from './sales.service';

export interface SalesSettings {
  taxRate: number;
  invoicePrefix: string;
  defaultStatus: SaleStatus;
  paymentMethods: string[];
  allowNegativeStock: boolean;
}

export interface EmployeeSettings {
  departments: string[];
  positions: string[];
  salaryCurrency: string;
}

export interface InventorySettings {
  lowStockThreshold: number;
  categories: string[];
}

interface SettingsMap {
  sales: SalesSettings;
  employees: EmployeeSettings;
  inventory: InventorySettings;
}

const settingsService = {
  get: async <K extends keyof SettingsMap>(key: K): Promise<SettingsMap[K]> => (await http.get(`/settings/${key}`)).data,
  save: async <K extends keyof SettingsMap>(key: K, value: Partial<SettingsMap[K]>): Promise<SettingsMap[K]> =>
    (await http.put(`/settings/${key}`, value)).data
};

export default settingsService;
