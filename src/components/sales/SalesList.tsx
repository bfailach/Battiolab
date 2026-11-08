import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { EmptyState, LoadGate, PageHeader, StatStrip, Surface } from '../shared/Page';
import DataTable, { Column } from '../shared/DataTable';
import SearchField from '../shared/SearchField';
import StatusChip, { saleTone } from '../shared/StatusChip';
import SaleDetails from './SaleDetails';
import { useSaleActions } from './useSaleActions';
import { inPeriod, Period, periodLabel } from './salesFilters';
import salesService, { isOverdue, Sale, SaleStatus, saleStatusLabel } from '../../services/sales.service';
import { useLoad } from '../../hooks/useLoad';
import { formatCurrency, formatDate } from '../../utils/format';
import { matches } from '../../utils/text';
import { downloadCsv } from '../../utils/csv';

const SalesList: React.FC = () => {
  const navigate = useNavigate();
  const state = useLoad(() => salesService.getAll());
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SaleStatus | 'all'>('all');
  const [period, setPeriod] = useState<Period>('30');
  const [selected, setSelected] = useState<Sale | null>(null);
  const actions = useSaleActions((updated) => {
    setSelected(updated);
    state.reload();
  });

  const inRange = useMemo(() => (state.data || []).filter((s) => inPeriod(s.date, period)), [state.data, period]);
  const rows = useMemo(
    () =>
      inRange.filter(
        (s) =>
          (status === 'all' || s.status === status) &&
          matches(search, s.client.name, s.customer?.document, s.number, s.creditNote?.number, ...s.items.map((i) => i.productName))
      ),
    [inRange, search, status]
  );

  const valid = inRange.filter((s) => s.status !== 'cancelled');
  const paid = valid.filter((s) => s.status === 'completed').reduce((t, s) => t + s.total, 0);
  const pending = inRange.filter((s) => s.status === 'pending');
  const vat = valid.reduce((t, s) => t + s.taxes.reduce((a, x) => a + x.amount, 0), 0);

  const columns: Column<Sale>[] = [
    { key: 'number', label: 'Factura', sortValue: (s) => s.number || '', render: (s) => <Typography variant="body2" sx={{ fontWeight: 800 }}>{s.number || '—'}</Typography> },
    { key: 'date', label: 'Fecha', sortValue: (s) => s.date, render: (s) => formatDate(s.date) },
    { key: 'client', label: 'Cliente', sortValue: (s) => s.client.name, render: (s) => s.client.name },
    {
      key: 'items',
      label: 'Productos',
      hideBelow: 'lg',
      render: (s) => (
        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 240 }}>
          {s.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
        </Typography>
      )
    },
    {
      key: 'form',
      label: 'Pago',
      hideBelow: 'md',
      render: (s) => (s.paymentForm === 'credito' ? `Crédito, vence ${formatDate(s.dueDate)}` : s.paymentMethod || 'Contado')
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      sortValue: (s) => s.total,
      render: (s) => (
        <Typography variant="body2" sx={{ fontWeight: 700, textDecoration: s.status === 'cancelled' ? 'line-through' : 'none', color: s.status === 'cancelled' ? 'text.secondary' : 'inherit' }}>
          {formatCurrency(s.total)}
        </Typography>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (s) => (isOverdue(s) ? <StatusChip label="Vencida" tone="bad" /> : <StatusChip label={saleStatusLabel[s.status]} tone={saleTone[s.status]} />)
    }
  ];

  const exportCsv = () =>
    downloadCsv(
      'facturas-battiolab.csv',
      ['Factura', 'Fecha', 'Cliente', 'Documento', 'Forma de pago', 'Medio de pago', 'Vencimiento', 'Subtotal', 'IVA', 'Total', 'Estado', 'Nota crédito'],
      rows.map((s) => [
        s.number,
        s.date.slice(0, 10),
        s.client.name,
        s.customer?.document,
        s.paymentForm === 'credito' ? 'Crédito' : 'Contado',
        s.paymentMethod,
        s.dueDate?.slice(0, 10),
        s.subtotal,
        s.taxes.reduce((a, x) => a + x.amount, 0),
        s.total,
        saleStatusLabel[s.status],
        s.creditNote?.number
      ])
    );

  return (
    <>
      <PageHeader
        title="Facturas"
        description="Todas las ventas facturadas. Las facturas no se borran: se anulan con nota crédito."
        actions={
          <>
            <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} disabled={!rows.length}>
              Exportar
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/dashboard/sales/new')}>
              Nueva venta
            </Button>
          </>
        }
      />
      <LoadGate state={state}>
        {(sales) => (
          <>
            <StatStrip
              stats={[
                { label: 'Recaudado', value: formatCurrency(paid), hint: periodLabel[period], accent: true },
                { label: 'Facturas', value: valid.length, hint: `${inRange.length - valid.length} anuladas` },
                { label: 'IVA generado', value: formatCurrency(vat) },
                { label: 'Por cobrar', value: formatCurrency(pending.reduce((t, s) => t + s.total, 0)), hint: `${pending.length} facturas` }
              ]}
            />
            <Surface padding={0}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2.5, alignItems: { md: 'center' } }}>
                <SearchField value={search} onChange={setSearch} placeholder="Buscar por cliente, número, documento o producto" maxWidth={420} />
                <ToggleButtonGroup size="small" exclusive value={status} onChange={(_, v) => v && setStatus(v)} aria-label="Filtrar por estado">
                  <ToggleButton value="all">Todas</ToggleButton>
                  <ToggleButton value="completed">Pagadas</ToggleButton>
                  <ToggleButton value="pending">Por cobrar</ToggleButton>
                  <ToggleButton value="cancelled">Anuladas</ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ flex: 1 }} />
                <TextField select fullWidth={false} label="Periodo" value={period} onChange={(e) => setPeriod(e.target.value as Period)} sx={{ minWidth: 190 }}>
                  {(Object.keys(periodLabel) as Period[]).map((p) => (
                    <MenuItem key={p} value={p}>
                      {periodLabel[p]}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <DataTable
                rows={rows}
                columns={columns}
                rowKey={(s) => s.id}
                onRowClick={setSelected}
                initialSort={{ key: 'date', dir: 'desc' }}
                empty={
                  sales.length === 0 ? (
                    <EmptyState
                      icon={<ReceiptLongOutlinedIcon />}
                      title="Todavía no hay facturas"
                      text="Registra la primera venta: elige el cliente, agrega productos y confirma."
                      action={
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/dashboard/sales/new')}>
                          Nueva venta
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState title="Ninguna factura coincide" text="Amplía el periodo o cambia el filtro de estado." />
                  )
                }
              />
            </Surface>
          </>
        )}
      </LoadGate>
      <SaleDetails sale={selected} onClose={() => setSelected(null)} onInvoice={actions.openInvoice} onPay={actions.openPay} onCancel={actions.openCancel} />
      {actions.dialogs}
    </>
  );
};

export default SalesList;
