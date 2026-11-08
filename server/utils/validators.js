/**
 * Validaciones de datos colombianos compartidas por las rutas.
 * Las mismas reglas existen en el frontend (src/utils/validation.ts) para dar respuesta inmediata,
 * pero el servidor es la fuente de verdad.
 */

const DOCUMENT_TYPES = {
  CC: { label: 'Cédula de ciudadanía', pattern: /^\d{6,10}$/, hint: 'entre 6 y 10 dígitos' },
  CE: { label: 'Cédula de extranjería', pattern: /^\d{6,10}$/, hint: 'entre 6 y 10 dígitos' },
  NIT: { label: 'NIT', pattern: /^\d{9}$/, hint: '9 dígitos, sin el dígito de verificación' },
  TI: { label: 'Tarjeta de identidad', pattern: /^\d{10,11}$/, hint: '10 u 11 dígitos' },
  PP: { label: 'Pasaporte', pattern: /^[A-Z0-9]{5,15}$/, hint: 'entre 5 y 15 letras o números' },
  PPT: { label: 'Permiso por protección temporal', pattern: /^\d{6,15}$/, hint: 'entre 6 y 15 dígitos' }
};

/** Documento genérico que la DIAN permite para compradores sin identificar. */
const FINAL_CONSUMER_DOCUMENT = '222222222222';

/** Dígito de verificación del NIT según el algoritmo de la DIAN (módulo 11). */
const nitCheckDigit = (nit) => {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = String(nit).replace(/\D/g, '').split('').reverse();
  const sum = digits.reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
  const r = sum % 11;
  return r > 1 ? 11 - r : r;
};

const cleanDocument = (type, value) => {
  const v = String(value || '').trim().toUpperCase();
  return type === 'PP' ? v.replace(/[^A-Z0-9]/g, '') : v.replace(/\D/g, '');
};

const validateDocument = (type, value) => {
  const def = DOCUMENT_TYPES[type];
  if (!def) return 'Tipo de documento no válido';
  if (value === FINAL_CONSUMER_DOCUMENT) return null;
  if (!def.pattern.test(value)) return `${def.label}: ${def.hint}`;
  return null;
};

/** Teléfonos colombianos: 10 dígitos, celular (3xx) o fijo (60x). */
const cleanPhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('57')) digits = digits.slice(2);
  return digits;
};
const validatePhone = (digits) =>
  /^(3\d{9}|60[1-8]\d{7})$/.test(digits) ? null : 'El teléfono debe tener 10 dígitos: celular (3xx) o fijo con indicativo (601 a 608)';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const validateEmail = (v, required = false) => {
  if (!v) return required ? 'El correo es obligatorio' : null;
  return EMAIL.test(v) ? null : 'El correo no tiene un formato válido';
};

/** SKU: mayúsculas, números y guiones; 3 a 32 caracteres. */
const cleanSku = (v) => String(v || '').trim().toUpperCase().replace(/\s+/g, '-');
const validateSku = (v) =>
  /^[A-Z0-9][A-Z0-9-]{2,31}$/.test(v) ? null : 'El SKU debe tener entre 3 y 32 caracteres: letras, números y guiones';

const TAX_RATES = [0, 5, 19];

const toMoney = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : NaN;
};

module.exports = {
  DOCUMENT_TYPES,
  FINAL_CONSUMER_DOCUMENT,
  TAX_RATES,
  nitCheckDigit,
  cleanDocument,
  validateDocument,
  cleanPhone,
  validatePhone,
  validateEmail,
  cleanSku,
  validateSku,
  toMoney
};
