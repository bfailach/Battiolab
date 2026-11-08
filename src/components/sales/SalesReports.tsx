import React, { useMemo, useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LoadGate, PageHeader, StatStrip, Surface } from '../shared/Page';
import ChargeMeter from '../shared/ChargeMeter';
import { useChartStyle } from '../shared/charts';
import { inPeriod, Period, periodLabel } from './salesFilters';
import salesService from '../../services/sales.service';
import productsService from '../../services/products.service';
import { useLoad } from '../../hooks/useLoad';
import { formatCompactCurrency, formatCurrency, formatNumber, lastMonths, monthKey, monthLabel } from '../../utils/format';
import { downloadCsv } from '../../utils/csv';

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

const SalesReports: React.FC = () => {
  const chart = useChartStyle();
  const [period, setPeriod] = useState<Period>('30');
  const state = useLoad(async () => {
    const [sales, products] = await Promise.all([salesService.getAll(), productsService.getAll()]);
    return { sales, products };
  });

  const report = useMemo(() => {
    if (!state.data) return null;
    const categoryOf = new Map(state.data.products.map((p) => [p.id, p.category]));
    const sales = state.data.sales.filter((s) => s.status !== 'cancelled' && inPeriod(s.date, period));
    const completed = sales.filter((s) => s.status === 'completed');
    const revenue = sales.reduce((t, s) => t + s.total, 0);
    const units = sales.reduce((t, s) => t + s.items.reduce((u, i) => u + i.quantity, 0), 0);

    // Serie temporal: por día si el periodo es corto, por mes si es largo
    let series: { label: string; ingresos: number }[];
    if (period === '7' || period === '30' || period === '90') {
      const days = Number(period);
      const buckets = new Map<string, number>();
      for (let i = days - 1; i >= 0; i -= 1) buckets.set(dayKey(new Date(Date.now() - i * 86400000)), 0);
      sales.forEach((s) => {
        const k = dayKey(new Date(s.date));
        if (buckets.has(k)) buckets.set(k, (buckets.get(k) || 0) + s.total);
      });
      series = [...buckets.entries()].map(([k, v]) => ({
        label: new Date(`${k}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
        ingresos: v
      }));
    } else {
      const months = period === '365' ? lastMonths(12) : [...new Set(sales.map((s) => monthKey(s.date)))].sort();
      series = (months.length ? months : lastMonths(6)).map((m) => ({
        label: monthLabel(m),
        ingresos: sales.filter((s) => monthKey(s.date) === m).reduce((t, s) => t + s.total, 0)
      }));
    }

    const byProduct = new Map<string, { name: string; units: number; revenue: number }>();
    const byCategory = new Map<string, number>();
    sales.forEach((s) =>
      s.items.forEach((i) => {
        const p = byProduct.get(i.productId) || { name: i.productName || 'Producto', units: 0, revenue: 0 };
        p.units += i.quantity;
        p.revenue += i.subtotal;
        byProduct.set(i.productId, p);
        const cat = categoryOf.get(i.productId) || 'Sin categoría';
        byCategory.set(cat, (byCategory.get(cat) || 0) + i.subtotal);
      })
    );
    const byPayment = new Map<string, number>();
    sales.forEach((s) => byPayment.set(s.paymentMethod || 'Sin especificar', (byPayment.get(s.paymentMethod || 'Sin especificar') || 0) + s.total));

    return {
      sales,
      revenue,
      units,
      count: sales.length,
      completedRate: sales.length ? completed.length / sales.length : 0,
      avg: sales.length ? revenue / sales.length : 0,
      series,
      topProducts: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
      categories: [...byCategory.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      payments: [...byPayment.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    };
  }, [state.data, period]);

  const exportCsv = () =>
    report &&
    downloadCsv(
      `productos-vendidos-${period}.csv`,
      ['Producto', 'Unidades', 'Ingresos'],
      report.topProducts.map((p) => [p.name, p.units, p.revenue])
    );

  const share = (v: number) => (report?.revenue ? v / report.revenue : 0);

  return (
    <>
      <PageHeader
        title="Reportes de ventas"
        description="Ingresos sin contar ventas anuladas. Las pendientes sí se incluyen."
        actions={
          <>
            <TextField select fullWidth={false} value={period} onChange={(e) => setPeriod(e.target.value as Period)} inputProps={{ 'aria-label': 'Periodo' }} sx={{ minWidth: 190 }}>
              {(Object.keys(periodLabel) as Period[]).map((p) => (
                <MenuItem key={p} value={p}>
                  {periodLabel[p]}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} disabled={!report?.topProducts.length}>
              Exportar
            </Button>
          </>
        }
      />
      <LoadGate state={state}>
        {() =>
          report && (
            <>
              <StatStrip
                stats={[
                  { label: 'Ingresos', value: formatCurrency(report.revenue) },
                  { label: 'Ventas', value: formatNumber(report.count), hint: `${Math.round(report.completedRate * 100)} % completadas` },
                  { label: 'Ticket promedio', value: formatCurrency(report.avg) },
                  { label: 'Unidades vendidas', value: formatNumber(report.units) }
                ]}
              />
              <Surface title="Ingresos" subtitle={periodLabel[period]} sx={{ mb: 3 }}>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={report.series} margin={{ left: 0, right: 8 }}>
                      <CartesianGrid vertical={false} stroke={chart.grid} />
                      <XAxis dataKey="label" tick={chart.axis} tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis tickFormatter={formatCompactCurrency} tick={chart.axis} tickLine={false} axisLine={false} width={64} />
                      <Tooltip {...chart.tooltip} formatter={(v: number) => formatCurrency(v)} />
                      <Bar isAnimationActive={false} dataKey="ingresos" name="Ingresos" fill={chart.colors[1]} radius={[3, 3, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Surface>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, gap: 3 }}>
                <Surface title="Productos más vendidos" subtitle="Por ingresos">
                  {report.topProducts.length ? (
                    <Box sx={{ height: Math.max(220, report.topProducts.length * 44) }}>
                      <ResponsiveContainer>
                        <BarChart data={report.topProducts} layout="vertical" margin={{ left: 8, right: 24 }}>
                          <CartesianGrid horizontal={false} stroke={chart.grid} />
                          <XAxis type="number" tickFormatter={formatCompactCurrency} tick={chart.axis} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="name" width={150} tick={chart.axis} tickLine={false} axisLine={false} />
                          <Tooltip {...chart.tooltip} formatter={(v: number, n: string) => (n === 'Ingresos' ? formatCurrency(v) : v)} />
                          <Bar isAnimationActive={false} dataKey="revenue" name="Ingresos" fill={chart.colors[0]} radius={[0, 4, 4, 0]} barSize={22} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay ventas en este periodo.
                    </Typography>
                  )}
                </Surface>
                <Stack spacing={3}>
                  <Surface title="Por categoría">
                    <Stack spacing={1.5}>
                      {report.categories.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Sin datos.
                        </Typography>
                      )}
                      {report.categories.map((c) => (
                        <Box key={c.name}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                            <Typography variant="body2">{formatCurrency(c.value)}</Typography>
                          </Box>
                          <ChargeMeter value={share(c.value)} level="ok" width={220} segments={20} height={12} label={`${Math.round(share(c.value) * 100)} %`} />
                        </Box>
                      ))}
                    </Stack>
                  </Surface>
                  <Surface title="Por método de pago">
                    <Stack spacing={1}>
                      {report.payments.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Sin datos.
                        </Typography>
                      )}
                      {report.payments.map((p) => (
                        <Box key={p.name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">{p.name}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(p.value)} <Typography component="span" variant="caption" color="text.secondary">({Math.round(share(p.value) * 100)} %)</Typography>
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Surface>
                </Stack>
              </Box>
            </>
          )
        }
      </LoadGate>
    </>
  );
};

export default SalesReports;
