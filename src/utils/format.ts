const currency = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 });
const number = new Intl.NumberFormat('es-CO');
const dateTime = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const month = new Intl.DateTimeFormat('es-CO', { month: 'short', year: '2-digit' });

export const formatCurrency = (v: number) => currency.format(v || 0);
export const formatCompactCurrency = (v: number) => `$${compact.format(v || 0)}`;
export const formatNumber = (v: number) => number.format(v || 0);
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
/** Fecha compacta para tablas: 7 nov 2026. Fechas YYYY-MM-DD se leen como hora local. */
export const formatDate = (v?: string | Date | null) => {
  if (!v) return '—';
  const d = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`) : new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const formatDateTime = (v?: string | Date | null) => (v ? dateTime.format(new Date(v)) : '—');
export const formatMonth = (v: string | Date) => month.format(new Date(v));
export const monthKey = (v: string | Date) => {
  const d = new Date(v);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Últimos n meses como claves YYYY-MM, del más antiguo al actual. */
export const lastMonths = (n: number) => {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return out;
};
export const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return formatMonth(new Date(y, m - 1, 1));
};

export const initials = (name?: string) =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export const yearsSince = (v: string | Date) => (Date.now() - new Date(v).getTime()) / (365.25 * 24 * 3600 * 1000);

export const toInputDate = (v?: string | Date | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');
