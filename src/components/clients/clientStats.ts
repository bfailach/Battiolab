import { Client } from '../../services/clients.service';
import { Sale } from '../../services/sales.service';

export interface ClientStats {
  count: number;
  spent: number;
  first: string | null;
  last: string | null;
  products: Map<string, { name: string; quantity: number }>;
}

/** Agrega las compras no anuladas de cada cliente. */
export const computeClientStats = (sales: Sale[]) => {
  const map = new Map<string, ClientStats>();
  sales
    .filter((s) => s.status !== 'cancelled' && s.client.id)
    .forEach((s) => {
      const id = s.client.id as string;
      const st = map.get(id) || { count: 0, spent: 0, first: null, last: null, products: new Map() };
      st.count += 1;
      st.spent += s.total;
      if (!st.first || s.date < st.first) st.first = s.date;
      if (!st.last || s.date > st.last) st.last = s.date;
      s.items.forEach((i) => {
        const p = st.products.get(i.productId) || { name: i.productName || 'Producto', quantity: 0 };
        p.quantity += i.quantity;
        st.products.set(i.productId, p);
      });
      map.set(id, st);
    });
  return map;
};

const DAY = 24 * 3600 * 1000;

export type Segment = 'vip' | 'frequent' | 'new' | 'dormant' | 'never';

export const segmentInfo: Record<Segment, { label: string; description: string }> = {
  vip: { label: 'Mejores clientes', description: 'El 20 % que más ha comprado en valor.' },
  frequent: { label: 'Recurrentes', description: 'Tres compras o más.' },
  new: { label: 'Nuevos', description: 'Registrados en los últimos 30 días.' },
  dormant: { label: 'Sin actividad', description: 'Compraron antes, pero no en los últimos 90 días.' },
  never: { label: 'Sin compras', description: 'Registrados, todavía sin comprar.' }
};

/** Asigna cada cliente a todos los segmentos que le aplican. */
export const segmentClients = (clients: Client[], stats: Map<string, ClientStats>) => {
  const buyers = clients.filter((c) => (stats.get(c.id)?.spent || 0) > 0);
  const sortedSpend = buyers.map((c) => stats.get(c.id)?.spent || 0).sort((a, b) => b - a);
  const vipCut = sortedSpend.length ? sortedSpend[Math.max(0, Math.ceil(sortedSpend.length * 0.2) - 1)] : Infinity;
  const now = Date.now();

  const result: Record<Segment, Client[]> = { vip: [], frequent: [], new: [], dormant: [], never: [] };
  clients.forEach((c) => {
    const st = stats.get(c.id);
    if (st && st.spent >= vipCut) result.vip.push(c);
    if (st && st.count >= 3) result.frequent.push(c);
    if (now - new Date(c.createdAt).getTime() <= 30 * DAY) result.new.push(c);
    if (st?.last && now - new Date(st.last).getTime() > 90 * DAY) result.dormant.push(c);
    if (!st) result.never.push(c);
  });
  return result;
};
