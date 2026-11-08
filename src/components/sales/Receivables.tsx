import React, { useMemo, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { EmptyState, LoadGate, PageHeader, StatStrip, Surface } from '../shared/Page';
import DataTable, { Column } from '../shared/DataTable';
import StatusChip from '../shared/StatusChip';
import { useSaleActions } from './useSaleActions';
import salesService, { Sale } from '../../services/sales.service';
import { useLoad } from '../../hooks/useLoad';
import { formatCurrency, formatDate } from '../../utils/format';
import { downloadCsv } from '../../utils/csv';

const DAY = 86400000;
const daysLate = (s: Sale) => (s.dueDate ? Math.floor((Date.now() - new Date(s.dueDate).getTime()) / DAY) : 0);

const BUCKETS = [
  { key: 'current', label: 'Al día', test: (d: number) => d <= 0 },
  { key: 'b30', label: '1 a 30 días', test: (d: number) => d >= 1 && d <= 30 },
  { key: 'b60', label: '31 a 60 días', test: (d: number) => d >= 31 && d <= 60 },
  { key: 'b90', label: 'Más de 60 días', test: (d: number) => d > 60 }
] as const;

/** Cartera: facturas a crédito pendientes, por antigüedad de la deuda. */
const Receivables: React.FC = () => {
  const state = useLoad(() => salesService.getAll({ status: 'pending' }));
  const [bucket, setBucket] = useState<string>('all');
  const actions = useSaleActions(() => state.reload());

  const data = useMemo(() => {
    const sales = state.data || [];
    const total = sales.reduce((t, s) => t + s.total, 0);
    const byBucket = BUCKETS.map((b) => {
      const list = sales.filter((s) => b.test(daysLate(s)));
      return { ...b, count: list.length, amount: list.reduce((t, s) => t + s.total, 0) };
    });
    const overdue = sales.filter((s) => daysLate(s) > 0);
    const soon = sales.filter((s) => {
      const d = daysLate(s);
      return d <= 0 && d >= -7;
    });
    return { sales, total, byBucket, overdue, soon, clients: new Set(sales.map((s) => s.client.id)).size };
  }, [state.data]);

  const rows = bucket === 'all' ? data.sales : data.sales.filter((s) => BUCKETS.find((b) => b.key === bucket)?.test(daysLate(s)));

  const columns: Column<Sale>[] = [
    { key: 'number', label: 'Factura', sortValue: (s) => s.number || '', render: (s) => <Typography variant="body2" sx={{ fontWeight: 800 }}>{s.number}</Typography> },
    { key: 'client', label: 'Cliente', sortValue: (s) => s.client.name, render: (s) => s.client.name },
    { key: 'date', label: 'Expedida', sortValue: (s) => s.date, render: (s) => formatDate(s.date), hideBelow: 'md' },
    { key: 'due', label: 'Vence', sortValue: (s) => s.dueDate || '', render: (s) => formatDate(s.dueDate) },
    {
      key: 'late',
      label: 'Estado',
      sortValue: (s) => daysLate(s),
      render: (s) => {
        const d = daysLate(s);
        if (d > 0) return <StatusChip label={`${d} días de mora`} tone="bad" />;
        if (d >= -7) return <StatusChip label={d === 0 ? 'Vence hoy' : `Vence en ${-d} días`} tone="warn" />;
        return <StatusChip label="Al día" tone="ok" />;
      }
    },
    { key: 'total', label: 'Saldo', align: 'right', sortValue: (s) => s.total, render: (s) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(s.total)}</Typography> },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (s) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
          <Button size="small" variant="outlined" startIcon={<DescriptionOutlinedIcon />} onClick={() => actions.openInvoice(s)}>
            Factura
          </Button>
          <Button size="small" variant="contained" startIcon={<PaymentsOutlinedIcon />} onClick={() => actions.openPay(s)}>
            Pago
          </Button>
        </Stack>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Por cobrar"
        description="Facturas a crédito pendientes de pago, ordenadas por antigüedad de la deuda."
        actions={
          <Button
            variant="outlined"
            disabled={!data.sales.length}
            onClick={() =>
              downloadCsv(
                'cartera-battiolab.csv',
                ['Factura', 'Cliente', 'Documento', 'Teléfono', 'Expedida', 'Vence', 'Días de mora', 'Saldo'],
                data.sales.map((s) => [s.number, s.client.name, s.customer?.document, s.customer?.phone, s.date.slice(0, 10), s.dueDate?.slice(0, 10), Math.max(0, daysLate(s)), s.total])
              )
            }
          >
            Exportar cartera
          </Button>
        }
      />
      <LoadGate state={state}>
        {() =>
          data.sales.length === 0 ? (
            <Surface>
              <EmptyState icon={<TaskAltOutlinedIcon />} title="No hay cuentas por cobrar" text="Todas las facturas a crédito están pagadas." />
            </Surface>
          ) : (
            <>
              <StatStrip
                stats={[
                  { label: 'Total por cobrar', value: formatCurrency(data.total), hint: `${data.sales.length} facturas, ${data.clients} clientes`, accent: true },
                  { label: 'Vencido', value: formatCurrency(data.overdue.reduce((t, s) => t + s.total, 0)), hint: `${data.overdue.length} facturas` },
                  { label: 'Vence en 7 días', value: formatCurrency(data.soon.reduce((t, s) => t + s.total, 0)), hint: `${data.soon.length} ${data.soon.length === 1 ? 'factura' : 'facturas'}` },
                  { label: 'Más de 60 días', value: formatCurrency(data.byBucket[3].amount), hint: 'Revisar con el cliente' }
                ]}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 1, mb: 3 }}>
                {[{ key: 'all', label: 'Toda la cartera', count: data.sales.length, amount: data.total }, ...data.byBucket].map((b) => {
                  const active = bucket === b.key;
                  return (
                    <Box
                      key={b.key}
                      role="button"
                      tabIndex={0}
                      aria-pressed={active}
                      onClick={() => setBucket(b.key)}
                      onKeyDown={(e) => e.key === 'Enter' && setBucket(b.key)}
                      sx={(t) => ({
                        p: 2,
                        borderRadius: 4,
                        cursor: 'pointer',
                        bgcolor: active ? t.palette.text.primary : 'surface.raised',
                        color: active ? t.palette.background.default : 'text.primary'
                      })}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {b.label}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        {formatCurrency(b.amount)}, {b.count} {b.count === 1 ? 'factura' : 'facturas'}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              <Surface padding={0}>
                <DataTable rows={rows} columns={columns} rowKey={(s) => s.id} initialSort={{ key: 'late', dir: 'desc' }} empty={<EmptyState title="Nada en este rango" />} />
              </Surface>
            </>
          )
        }
      </LoadGate>
      {actions.dialogs}
    </>
  );
};

export default Receivables;
