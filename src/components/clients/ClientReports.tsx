import React, { useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LoadGate, PageHeader, StatStrip, Surface } from '../shared/Page';
import ChargeMeter from '../shared/ChargeMeter';
import { useChartStyle } from '../shared/charts';
import { computeClientStats, segmentClients } from './clientStats';
import clientsService from '../../services/clients.service';
import salesService from '../../services/sales.service';
import { useLoad } from '../../hooks/useLoad';
import { formatCompactCurrency, formatCurrency, lastMonths, monthKey, monthLabel } from '../../utils/format';
import { downloadCsv } from '../../utils/csv';

const ClientReports: React.FC = () => {
  const chart = useChartStyle();
  const state = useLoad(async () => {
    const [clients, sales] = await Promise.all([clientsService.getAll(), salesService.getAll()]);
    return { clients, sales };
  });

  const report = useMemo(() => {
    if (!state.data) return null;
    const { clients, sales } = state.data;
    const stats = computeClientStats(sales);
    const groups = segmentClients(clients, stats);
    const months = lastMonths(12);
    const newByMonth = months.map((m) => ({
      month: monthLabel(m),
      nuevos: clients.filter((c) => monthKey(c.createdAt) === m).length,
      compradores: new Set(sales.filter((s) => s.status !== 'cancelled' && monthKey(s.date) === m).map((s) => s.client.id)).size
    }));
    const buyers = clients.filter((c) => stats.has(c.id));
    const repeat = buyers.filter((c) => (stats.get(c.id)?.count || 0) >= 2).length;
    const top = buyers
      .map((c) => ({ name: c.name, spent: stats.get(c.id)?.spent || 0, count: stats.get(c.id)?.count || 0 }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 8);
    const revenue = [...stats.values()].reduce((s, x) => s + x.spent, 0);
    const vipRevenue = groups.vip.reduce((s, c) => s + (stats.get(c.id)?.spent || 0), 0);
    const thisMonth = monthKey(new Date());
    return {
      clients,
      stats,
      newByMonth,
      top,
      total: clients.length,
      active: clients.filter((c) => c.status).length,
      newThisMonth: clients.filter((c) => monthKey(c.createdAt) === thisMonth).length,
      buyers: buyers.length,
      repeatRate: buyers.length ? repeat / buyers.length : 0,
      vipShare: revenue ? vipRevenue / revenue : 0,
      avgSpend: buyers.length ? revenue / buyers.length : 0
    };
  }, [state.data]);

  const exportCsv = () =>
    report &&
    downloadCsv(
      'reporte-clientes.csv',
      ['Cliente', 'Compras', 'Total comprado'],
      report.clients.map((c) => [c.name, report.stats.get(c.id)?.count || 0, report.stats.get(c.id)?.spent || 0])
    );

  return (
    <>
      <PageHeader
        title="Reportes de clientes"
        description="Cómo crece la base de clientes y cuánto vuelve a comprar."
        actions={
          <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} disabled={!report?.total}>
            Exportar CSV
          </Button>
        }
      />
      <LoadGate state={state}>
        {() =>
          report && (
            <>
              <StatStrip
                stats={[
                  { label: 'Clientes registrados', value: report.total, hint: `${report.active} activos` },
                  { label: 'Nuevos este mes', value: report.newThisMonth },
                  { label: 'Han comprado', value: report.buyers, hint: report.total ? `${Math.round((report.buyers / report.total) * 100)} % del total` : undefined },
                  { label: 'Gasto promedio', value: formatCurrency(report.avgSpend), hint: 'Por cliente comprador' }
                ]}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, mb: 3 }}>
                <Surface title="Nuevos clientes y compradores por mes" subtitle="Últimos 12 meses">
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer>
                      <BarChart data={report.newByMonth} margin={{ left: -20, right: 8 }}>
                        <CartesianGrid vertical={false} stroke={chart.grid} />
                        <XAxis dataKey="month" tick={chart.axis} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={chart.axis} tickLine={false} axisLine={false} />
                        <Tooltip {...chart.tooltip} />
                        <Bar isAnimationActive={false} dataKey="nuevos" name="Nuevos" fill={chart.colors[0]} radius={[4, 4, 0, 0]} />
                        <Bar isAnimationActive={false} dataKey="compradores" name="Compraron" fill={chart.colors[1]} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Surface>
                <Surface title="Fidelidad">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Volvieron a comprar
                      </Typography>
                      <Typography variant="h2" component="p" sx={{ my: 0.5 }}>
                        {Math.round(report.repeatRate * 100)} %
                      </Typography>
                      <ChargeMeter value={report.repeatRate} level={report.repeatRate >= 0.3 ? 'ok' : 'low'} width={200} height={16} />
                      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
                        De los clientes que compraron, cuántos lo hicieron dos veces o más.
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Ingresos del 20 % que más compra
                      </Typography>
                      <Typography variant="h2" component="p" sx={{ my: 0.5 }}>
                        {Math.round(report.vipShare * 100)} %
                      </Typography>
                      <ChargeMeter value={report.vipShare} level="ok" width={200} height={16} />
                    </Box>
                  </Box>
                </Surface>
              </Box>
              <Surface title="Clientes que más compran" subtitle="Por valor total, sin ventas anuladas">
                {report.top.length ? (
                  <Box sx={{ height: Math.max(200, report.top.length * 44) }}>
                    <ResponsiveContainer>
                      <BarChart data={report.top} layout="vertical" margin={{ left: 8, right: 24 }}>
                        <CartesianGrid horizontal={false} stroke={chart.grid} />
                        <XAxis type="number" tickFormatter={formatCompactCurrency} tick={chart.axis} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" width={160} tick={chart.axis} tickLine={false} axisLine={false} />
                        <Tooltip {...chart.tooltip} formatter={(v: number) => formatCurrency(v)} />
                        <Bar isAnimationActive={false} dataKey="spent" name="Total comprado" fill={chart.colors[0]} radius={[0, 4, 4, 0]} barSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Aún no hay ventas para comparar.
                  </Typography>
                )}
              </Surface>
            </>
          )
        }
      </LoadGate>
    </>
  );
};

export default ClientReports;
