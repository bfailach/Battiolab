import http from '../api/http';
import { SaleStatus } from './sales.service';

export interface CompanySettings {
  legalName: string;
  tradeName: string;
  nit: string;
  checkDigit: string;
  taxRegime: 'responsable' | 'no_responsable' | 'simple';
  taxNotes: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  resolutionNumber: string;
  resolutionDate: string;
  resolutionPrefix: string;
  resolutionFrom: number;
  resolutionTo: number;
  resolutionValidUntil: string;
  invoiceFooter: string;
  uvt: number;
  minimumWage: number;
}

export const taxRegimeLabel: Record<CompanySettings['taxRegime'], string> = {
  responsable: 'Responsable de IVA',
  no_responsable: 'No responsable de IVA',
  simple: 'Régimen Simple de Tributación'
};

export interface SalesSettings {
  invoicePrefix: string;
  creditNotePrefix: string;
  defaultCreditDays: number;
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
  company: CompanySettings;
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
