export type Period = '7' | '30' | '90' | '365' | 'all';

export const periodLabel: Record<Period, string> = {
  '7': 'Últimos 7 días',
  '30': 'Últimos 30 días',
  '90': 'Últimos 90 días',
  '365': 'Último año',
  all: 'Todo el tiempo'
};

export const inPeriod = (date: string, period: Period) =>
  period === 'all' || Date.now() - new Date(date).getTime() <= Number(period) * 86400000;
