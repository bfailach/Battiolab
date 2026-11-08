import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Link, Stack, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LoadGate, PageHeader, StatStrip, Surface } from './shared/Page';
import ChargeMeter, { StockMeter, stockLevel } from './shared/ChargeMeter';
import StatusChip, { saleTone } from './shared/StatusChip';
import { useChartStyle } from './shared/charts';
import clientsService from '../services/clients.service';
import employeesService from '../services/employees.service';
import productsService from '../services/products.service';
import salesService, { saleStatusLabel } from '../services/sales.service';
import settingsService from '../services/settings.service';
import { useLoad } from '../hooks/useLoad';
import { useAuth } from '../contexts/AuthContext';
import { formatCompactCurrency, formatCurrency, monthKey } from '../utils/format';
import { brand } from '../theme';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const chart = useChartStyle();
  const { user } = useAuth();
  const state = useLoad(async () => {
    const [clients, employees, products, sales, inv] = await Promise.all([
      clientsService.getAll(),
      employeesService.getAll(),
      productsService.getAll(),
      salesService.getAll(),
      settingsService.get('inventory').catch(() => ({ lowStockThreshold: 5, categories: [] }))
    ]);
    return { clients, employees, products, sales, threshold: inv.lowStockThreshold };
  });

  const d = useMemo(() => {
    if (!state.data) return null;
    const { sales, products, threshold, clients, employees } = state.data;
    const valid = sales.filter((s) => s.status !== 'cancelled');
    const now = new Date();
    const thisM = monthKey(now);
    const prevM = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const today = now.toDateString();
    const month = valid.filter((s) => monthKey(s.date) === thisM);
    const prev = valid.filter((s) => monthKey(s.date) === prevM);
    const monthRevenue = month.reduce((t, s) => t + s.total, 0);
    const prevRevenue = prev.reduce((t, s) => t + s.total, 0);
    const todayRevenue = valid.filter((s) => new Date(s.date).toDateString() === today).reduce((t, s) => t + s.total, 0);
    const pending = sales.filter((s) => s.status === 'pending');

    const days = Array.from({ length: 14 }, (_, i) => {
      const day = new Date(now.getTime() - (13 - i) * 86400000);
      const key = day.toDateString();
      return {
        label: day.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
        ingresos: valid.filter((s) => new Date(s.date).toDateString() === key).reduce((t, s) => t + s.total, 0)
      };
    });

    const active = products.filter((p) => p.status !== 'discontinued');
    const healthy = active.filter((p) => stockLevel(p.stock, p.minStock, threshold) === 'ok');
    const alerts = active
      .filter((p) => stockLevel(p.stock, p.minStock, threshold) !== 'ok')
      .sort((a, b) => a.stock - b.stock);

    const top = new Map<string, { name: string; units: number }>();
    month.forEach((s) =>
      s.items.forEach((i) => {
        const t = top.get(i.productId) || { name: i.productName || 'Producto', units: 0 };
        t.units += i.quantity;
        top.set(i.productId, t);
      })
    );

    return {
      monthRevenue,
      change: prevRevenue ? (monthRevenue - prevRevenue) / prevRevenue : null,
      todayRevenue,
      monthCount: month.length,
      pending,
      days,
      health: active.length ? healthy.length / active.length : 1,
      activeCount: active.length,
      alerts,
      threshold,
      recent: sales.slice(0, 6),
      top: [...top.values()].sort((a, b) => b.units - a.units).slice(0, 5),
      clients: clients.filter((c) => c.status).length,
      employees: employees.filter((e) => e.status).length
    };
  }, [state.data]);

  const name = user?.user.name || user?.user.email.split('@')[0] || '';
  const healthLevel = !d ? 'ok' : d.health >= 0.8 ? 'ok' : d.health >= 0.5 ? 'low' : 'empty';

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name}`}
        description={new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />
      <LoadGate state={state}>
        {() =>
          d && (
            <>
              <StatStrip
                stats={[
                  {
                    label: 'Ingresos del mes',
                    value: formatCurrency(d.monthRevenue),
                    hint:
                      d.change === null
                        ? 'Sin datos del mes anterior'
                        : `${d.change >= 0 ? '+' : ''}${Math.round(d.change * 100)} % frente al mes anterior`
                  },
                  { label: 'Vendido hoy', value: formatCurrency(d.todayRevenue) },
                  { label: 'Ventas del mes', value: d.monthCount, hint: `${d.clients} clientes activos` },
                  {
                    label: 'Pendientes de cobro',
                    value: formatCurrency(d.pending.reduce((t, s) => t + s.total, 0)),
                    hint: `${d.pending.length} ventas`
                  }
                ]}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: 3, mb: 3 }}>
                <Surface title="Ingresos de los últimos 14 días">
                  <Box sx={{ height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={d.days} margin={{ left: 0, right: 8 }}>
                        <CartesianGrid vertical={false} stroke={chart.grid} />
                        <XAxis dataKey="label" tick={chart.axis} tickLine={false} axisLine={false} minTickGap={16} />
                        <YAxis tickFormatter={formatCompactCurrency} tick={chart.axis} tickLine={false} axisLine={false} width={60} />
                        <Tooltip {...chart.tooltip} formatter={(v: number) => formatCurrency(v)} />
                        <Bar isAnimationActive={false} dataKey="ingresos" name="Ingresos" fill={chart.colors[0]} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Surface>

                <Surface
                  title="Carga del inventario"
                  subtitle={`${d.activeCount} productos activos`}
                  action={
                    <Button size="small" onClick={() => navigate('/dashboard/inventory/alerts')}>
                      Ver alertas
                    </Button>
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h1" component="p">
                      {Math.round(d.health * 100)} %
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      con stock suficiente
                    </Typography>
                  </Box>
                  <Box sx={{ my: 2 }}>
                    <ChargeMeter value={d.health} level={healthLevel} segments={12} width={300} height={26} />
                  </Box>
                  {d.alerts.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Ningún producto en alerta.
                    </Typography>
                  ) : (
                    <Stack spacing={1.25}>
                      {d.alerts.slice(0, 4).map((p) => (
                        <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
                            {p.name}
                          </Typography>
                          <StockMeter stock={p.stock} minStock={p.minStock} threshold={d.threshold} width={60} />
                        </Box>
                      ))}
                      {d.alerts.length > 4 && (
                        <Typography variant="caption" color="text.secondary">
                          Y {d.alerts.length - 4} más.
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Surface>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: 3 }}>
                <Surface
                  title="Ventas recientes"
                  padding={0}
                  action={
                    <Button size="small" onClick={() => navigate('/dashboard/sales/list')}>
                      Ver todas
                    </Button>
                  }
                >
                  {d.recent.length === 0 ? (
                    <Box sx={{ p: 2.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Todavía no hay ventas.{' '}
                        <Link component="button" onClick={() => navigate('/dashboard/sales/new')} sx={{ verticalAlign: 'baseline' }}>
                          Registra la primera
                        </Link>
                        .
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {d.recent.map((s) => (
                        <Box
                          key={s.id}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr auto', sm: '64px 1fr auto auto' },
                            gap: 2,
                            alignItems: 'center',
                            px: 2.5,
                            py: 1.5,
                            borderTop: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                            {new Date(s.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          </Typography>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                              {s.client.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="div" noWrap>
                              {s.items.map((i) => i.productName).join(', ')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <StatusChip label={saleStatusLabel[s.status]} tone={saleTone[s.status]} />
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'right' }}>
                            {formatCurrency(s.total)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Surface>
                <Surface title="Lo más vendido este mes">
                  {d.top.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Sin ventas este mes.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {d.top.map((t, i) => (
                        <Box key={t.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 6,
                              alignSelf: 'stretch',
                              borderRadius: 1,
                              bgcolor: i === 0 ? brand.charge : 'divider'
                            }}
                          />
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {t.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {t.units} u.
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Surface>
              </Box>
            </>
          )
        }
      </LoadGate>
    </>
  );
};

export default Dashboard;
