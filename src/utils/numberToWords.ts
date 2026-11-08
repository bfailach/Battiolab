const UNITS = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

const below1000 = (n: number): string => {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let out = HUNDREDS[h];
  if (rest) {
    const part = rest < 30 ? UNITS[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? ` y ${UNITS[rest % 10]}` : ''}`;
    out = out ? `${out} ${part}` : part;
  }
  return out;
};

/** Apocopa "uno" delante de sustantivos: "veintiún mil", "un millón". */
const apocope = (s: string) => s.replace(/veintiuno$/, 'veintiún').replace(/(^|\s)uno$/, '$1un');

const toWords = (n: number): string => {
  if (n === 0) return 'cero';
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (millions) parts.push(millions === 1 ? 'un millón' : `${apocope(toWords(millions))} millones`);
  if (thousands) parts.push(thousands === 1 ? 'mil' : `${apocope(below1000(thousands))} mil`);
  if (rest) parts.push(below1000(rest));
  return parts.join(' ');
};

/** 1250000 → "UN MILLÓN DOSCIENTOS CINCUENTA MIL PESOS M/CTE" (forma usual en facturas colombianas). */
export const amountInWords = (value: number) => {
  const n = Math.round(Math.abs(value));
  let words = apocope(toWords(n));
  // "un millón pesos" → "un millón de pesos" cuando termina en millón/millones exactos
  const de = n >= 1_000_000 && n % 1_000_000 === 0 ? ' de' : '';
  words = `${words}${de} ${n === 1 ? 'peso' : 'pesos'} m/cte`;
  return words.toUpperCase();
};
