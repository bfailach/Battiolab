/** Reglas colombianas de datos. Reflejan server/utils/validators.js para validar mientras se escribe. */

export type DocumentType = 'CC' | 'CE' | 'NIT' | 'TI' | 'PP' | 'PPT';

export const DOCUMENT_TYPES: Record<DocumentType, { label: string; short: string; min: number; max: number; alpha?: boolean; hint: string }> = {
  CC: { label: 'Cédula de ciudadanía', short: 'CC', min: 6, max: 10, hint: '6 a 10 dígitos' },
  CE: { label: 'Cédula de extranjería', short: 'CE', min: 6, max: 10, hint: '6 a 10 dígitos' },
  NIT: { label: 'NIT', short: 'NIT', min: 9, max: 9, hint: '9 dígitos sin el de verificación' },
  TI: { label: 'Tarjeta de identidad', short: 'TI', min: 10, max: 11, hint: '10 u 11 dígitos' },
  PP: { label: 'Pasaporte', short: 'PA', min: 5, max: 15, alpha: true, hint: '5 a 15 letras o números' },
  PPT: { label: 'Permiso por protección temporal', short: 'PPT', min: 6, max: 15, hint: '6 a 15 dígitos' }
};

export const FINAL_CONSUMER_DOCUMENT = '222222222222';

export const cleanDocument = (type: DocumentType, value: string) =>
  DOCUMENT_TYPES[type]?.alpha ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : value.replace(/\D/g, '');

export const validateDocument = (type: DocumentType, value: string): string | null => {
  const def = DOCUMENT_TYPES[type];
  if (!value) return 'Escribe el número de documento';
  if (value === FINAL_CONSUMER_DOCUMENT) return null;
  if (value.length < def.min || value.length > def.max) return `${def.label}: ${def.hint}`;
  return null;
};

/** Dígito de verificación del NIT (algoritmo módulo 11 de la DIAN). */
export const nitCheckDigit = (nit: string) => {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = nit.replace(/\D/g, '').split('').reverse();
  const sum = digits.reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
  const r = sum % 11;
  return r > 1 ? 11 - r : r;
};

/** 1020304050 → 1.020.304.050 ; NIT 900123456 → 900.123.456-8 */
export const formatDocument = (type: string | undefined, value?: string, checkDigit?: number | string) => {
  if (!value) return '—';
  if (value === FINAL_CONSUMER_DOCUMENT) return value;
  if (type === 'PP') return value;
  const grouped = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (type === 'NIT') return `${grouped}-${checkDigit ?? nitCheckDigit(value)}`;
  return grouped;
};

export const docLabel = (type?: string) => DOCUMENT_TYPES[(type || 'CC') as DocumentType]?.short || type || 'CC';

export const cleanPhone = (value: string) => {
  let d = value.replace(/\D/g, '');
  if (d.length > 10 && d.startsWith('57')) d = d.slice(2);
  return d.slice(0, 10);
};
export const validatePhone = (digits: string): string | null => {
  if (!digits) return 'Escribe el teléfono';
  if (digits.length !== 10) return 'Debe tener 10 dígitos';
  if (!/^(3\d{9}|60[1-8]\d{7})$/.test(digits)) return 'Celular (3xx) o fijo con indicativo (601 a 608)';
  return null;
};
/** 3001234567 → 300 123 4567 ; 6012345678 → 601 234 5678 */
export const formatPhone = (digits?: string) => {
  if (!digits) return '—';
  const d = digits.replace(/\D/g, '');
  if (d.length !== 10) return digits;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const validateEmail = (v: string, required = false): string | null => {
  if (!v) return required ? 'Escribe el correo' : null;
  return EMAIL.test(v) ? null : 'El correo no tiene un formato válido';
};

export const cleanSku = (v: string) => v.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '').slice(0, 32);
export const validateSku = (v: string): string | null =>
  /^[A-Z0-9][A-Z0-9-]{2,31}$/.test(v) ? null : 'Entre 3 y 32 caracteres: letras, números y guiones';

export const validateName = (v: string, min = 3): string | null =>
  v.trim().length >= min ? null : `Mínimo ${min} caracteres`;

export const TAX_RATES = [
  { value: 19, label: '19 % (tarifa general)' },
  { value: 5, label: '5 % (tarifa diferencial)' },
  { value: 0, label: 'Excluido / 0 %' }
];
