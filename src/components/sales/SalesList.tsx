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
import { inPeriod, Period, periodLabel } from './salesFilters';
import salesService, { Sale, SaleStatus, saleStatusLabel } from '../../services/sales.service';
import { useLoad } from '../../hooks/useLoad';
import { useUI } from '../../contexts/UIContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { downloadCsv } from '../../utils/csv';

const SalesList: React.FC = () => {
  const navigate = useNavigate();
  const { notify, confirm } = useUI();
  const state = useLoad(() => salesService.getAll());
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SaleStatus | 'all'>('all');
  const [period, setPeriod] = useState<Period>('30');
  const [selected, setSelected] = useState<Sale | null>(null);

  const inRange = useMemo(() => (state.data || []).filter((s) => inPeriod(s.date, period)), [state.data, period]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inRange.filter(
      (s) =>
        (status === 'all' || s.status === status) &&
        (!q || s.client.name.toLowerCase().includes(q) || (s.number || '').toLowerCase().includes(q) || s.items.some((i) => i.productName?.toLowerCase().includes(q)))
    );
  }, [inRange, search, status]);

  const valid = inRange.filter((s) => s.status !== 'cancelled');
  const revenue = valid.filter((s) => s.status === 'completed').reduce((t, s) => t + s.total, 0);
  const pending = inRange.filter((s) => s.status === 'pending');

  const columns: Column<Sale>[] = [
    { key: 'number', label: 'N.º', sortValue: (s) => s.number || '', render: (s) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.number || '—'}</Typography> },
    { key: 'date', label: 'Fecha', sortValue: (s) => s.date, render: (s) => formatDate(s.date) },
    { key: 'client', label: 'Cliente', sortValue: (s) => s.client.name, render: (s) => s.client.name },
    {
      key: 'items',
      label: 'Productos',
      hideBelow: 'lg',
      render: (s) => (
        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 260 }}>
          {s.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
        </Typography>
      )
    },
    { key: 'payment', label: 'Pago', render: (s) => s.paymentMethod || '—', hideBelow: 'md' },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      sortValue: (s) => s.total,
      render: (s) => (
        <Typography variant="body2" sx={{ fontWeight: 600, textDecoration: s.status === 'cancelled' ? 'line-through' : 'none', color: s.status === 'cancelled' ? 'text.secondary' : 'inherit' }}>
          {formatCurrency(s.total)}
        </Typography>
      )
    },
    { key: 'status', label: 'Estado', render: (s) => <StatusChip label={saleStatusLabel[s.status]} tone={saleTone[s.status]} /> }
  ];

  const changeStatus = async (sale: Sale, next: SaleStatus) => {
    if (next === 'cancelled') {
      const ok = await confirm({
        title: `¿Anular la venta ${sale.number || ''}?`,
        message: 'Las unidades vuelven al inventario y la venta deja de contar en los reportes.',
        confirmLabel: 'Anular venta',
        destructive: true
      });
      if (!ok) return;
    }
    try {
      const updated = await salesService.update(sale.id, { status: next });
      setSelected(updated);
      notify(next === 'cancelled' ? 'Venta anulada. El stock fue repuesto.' : `Venta ${saleStatusLabel[next].toLowerCase()}`);
      state.reload();
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };

  const remove = async (sale: Sale) => {
    const ok = await confirm({
      title: `¿Eliminar la venta ${sale.number || ''}?`,
      message: 'Se borra del sistema y, si no estaba anulada, las unidades vuelven al inventario. Para conservar el registro, anúlala.',
      confirmLabel: 'Eliminar venta',
      destructive: true
    });
    if (!ok) return;
    try {
      await salesService.delete(sale.id);
      notify('Venta eliminada');
      setSelected(null);
      state.reload();
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };

  const exportCsv = () =>
    downloadCsv(
      'ventas-battiolab.csv',
      ['Número', 'Fecha', 'Cliente', 'Productos', 'Método de pago', 'Subtotal', 'Impuesto', 'Total', 'Estado'],
      rows.map((s) => [
        s.number,
        s.date.slice(0, 10),
        s.client.name,
        s.items.map((i) => `${i.quantity}x ${i.productName}`).join('; '),
        s.paymentMethod,
        s.subtotal,
        s.taxAmount,
        s.total,
        saleStatusLabel[s.status]
      ])
    );

  return (
    <>
      <PageHeader
        title="Ventas"
        description="Todas las ventas registradas. Anular una venta devuelve sus unidades al inventario."
        actions={
          <>
            <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} disabled={!rows.length}>
              Exportar CSV
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
                { label: 'Ingresos completados', value: formatCurrency(revenue), hint: periodLabel[period] },
                { label: 'Ventas', value: valid.length, hint: `${inRange.length - valid.length} anuladas` },
                { label: 'Ticket promedio', value: formatCurrency(valid.length ? valid.reduce((t, s) => t + s.total, 0) / valid.length : 0) },
                { label: 'Pendientes de cobro', value: formatCurrency(pending.reduce((t, s) => t + s.total, 0)), hint: `${pending.length} ventas` }
              ]}
            />
            <Surface padding={0}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2, alignItems: { md: 'center' } }}>
                <SearchField value={search} onChange={setSearch} placeholder="Buscar por cliente, número o producto" />
                <ToggleButtonGroup size="small" exclusive value={status} onChange={(_, v) => v && setStatus(v)} aria-label="Filtrar por estado">
                  <ToggleButton value="all">Todas</ToggleButton>
                  <ToggleButton value="completed">Completadas</ToggleButton>
                  <ToggleButton value="pending">Pendientes</ToggleButton>
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
                      title="Todavía no hay ventas"
                      text="Registra la primera venta: elige el cliente, agrega productos y confirma."
                      action={
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/dashboard/sales/new')}>
                          Nueva venta
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState title="Ninguna venta coincide" text="Amplía el periodo o cambia el filtro de estado." />
                  )
                }
              />
            </Surface>
          </>
        )}
      </LoadGate>
      <SaleDetails sale={selected} onClose={() => setSelected(null)} onStatus={changeStatus} onDelete={remove} />
    </>
  );
};

export default SalesList;
