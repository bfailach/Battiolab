import React, { useMemo, useState } from 'react';
import { Autocomplete, Box, Button, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import { EmptyState, LoadGate, PageHeader, StatStrip, Surface } from '../shared/Page';
import DataTable, { Column } from '../shared/DataTable';
import StatusChip from '../shared/StatusChip';
import DetailDrawer, { DetailRow } from '../shared/DetailDrawer';
import LotForm from './LotForm';
import lotsService, { CreateLotData, Lot } from '../../services/lots.service';
import productsService, { Product } from '../../services/products.service';
import { useLoad } from '../../hooks/useLoad';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, formatNumber, monthKey } from '../../utils/format';

const warrantyChip = (d: string | null) => {
  if (!d) return <Typography variant="body2" color="text.secondary">—</Typography>;
  const days = (new Date(d).getTime() - Date.now()) / 86400000;
  if (days < 0) return <StatusChip label={`Vencida ${formatDate(d)}`} tone="bad" />;
  if (days < 60) return <StatusChip label={`Vence ${formatDate(d)}`} tone="warn" />;
  return <StatusChip label={formatDate(d)} tone="ok" />;
};

const InventoryLots: React.FC = () => {
  const { notify, confirm } = useUI();
  const { isAdmin } = useAuth();
  const state = useLoad(async () => {
    const [lots, products] = await Promise.all([lotsService.getAll(), productsService.getAll()]);
    return { lots, products };
  });
  const [product, setProduct] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Lot | null>(null);

  const rows = useMemo(() => (state.data?.lots || []).filter((l) => !product || l.product.id === product.id), [state.data, product]);

  const stats = useMemo(() => {
    const lots = state.data?.lots || [];
    const m = monthKey(new Date());
    const thisMonth = lots.filter((l) => monthKey(l.receivedAt) === m);
    return {
      count: thisMonth.length,
      units: thisMonth.reduce((s, l) => s + l.quantity, 0),
      cost: thisMonth.reduce((s, l) => s + l.quantity * (l.unitCost || 0), 0),
      suppliers: new Set(lots.map((l) => l.supplier).filter(Boolean)).size
    };
  }, [state.data]);

  const columns: Column<Lot>[] = [
    { key: 'lot', label: 'Lote', sortValue: (l) => l.lotNumber, render: (l) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{l.lotNumber}</Typography> },
    {
      key: 'product',
      label: 'Producto',
      sortValue: (l) => l.product.name,
      render: (l) => (
        <Box>
          <Typography variant="body2">{l.product.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {l.product.sku}
          </Typography>
        </Box>
      )
    },
    { key: 'qty', label: 'Unidades', align: 'right', sortValue: (l) => l.quantity, render: (l) => formatNumber(l.quantity) },
    { key: 'cost', label: 'Costo total', align: 'right', sortValue: (l) => l.quantity * l.unitCost, render: (l) => formatCurrency(l.quantity * l.unitCost), hideBelow: 'md' },
    { key: 'supplier', label: 'Proveedor', sortValue: (l) => l.supplier, render: (l) => l.supplier || '—', hideBelow: 'lg' },
    { key: 'received', label: 'Recibido', sortValue: (l) => l.receivedAt, render: (l) => formatDate(l.receivedAt) },
    { key: 'warranty', label: 'Garantía', sortValue: (l) => l.warrantyUntil || '', render: (l) => warrantyChip(l.warrantyUntil), hideBelow: 'md' }
  ];

  const save = async (data: CreateLotData) => {
    const lot = await lotsService.create(data);
    notify(`Lote ${lot.lotNumber} registrado: +${lot.quantity} u. de ${lot.product.name}`);
    setFormOpen(false);
    state.reload();
  };

  const remove = async (lot: Lot) => {
    const ok = await confirm({
      title: `¿Eliminar el lote ${lot.lotNumber}?`,
      message: `Se restarán ${lot.quantity} u. del stock de ${lot.product.name}. Solo es posible si esas unidades siguen en bodega.`,
      confirmLabel: 'Eliminar lote',
      destructive: true
    });
    if (!ok) return;
    try {
      await lotsService.delete(lot.id);
      notify('Lote eliminado');
      setSelected(null);
      state.reload();
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Lotes"
        description="Cada pedido que llega del proveedor. Registrarlo suma las unidades al stock y deja la garantía a mano."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)} disabled={!state.data?.products.length}>
            Registrar lote
          </Button>
        }
      />
      <LoadGate state={state}>
        {(data) => (
          <>
            <StatStrip
              stats={[
                { label: 'Lotes este mes', value: stats.count },
                { label: 'Unidades recibidas este mes', value: formatNumber(stats.units) },
                { label: 'Costo de compras este mes', value: formatCurrency(stats.cost) },
                { label: 'Proveedores', value: stats.suppliers }
              ]}
            />
            <Surface padding={0}>
              <Stack direction="row" sx={{ p: 2 }}>
                <Autocomplete<Product>
                  options={data.products}
                  value={product}
                  onChange={(_, p) => setProduct(p)}
                  getOptionLabel={(p) => `${p.name} (${p.sku})`}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderInput={(p) => <TextField {...p} label="Filtrar por producto" />}
                  sx={{ width: '100%', maxWidth: 360 }}
                />
              </Stack>
              <DataTable
                rows={rows}
                columns={columns}
                rowKey={(l) => l.id}
                onRowClick={setSelected}
                initialSort={{ key: 'received', dir: 'desc' }}
                empty={
                  <EmptyState
                    icon={<LayersOutlinedIcon />}
                    title={data.lots.length ? 'Este producto no tiene lotes' : 'Todavía no hay lotes'}
                    text={data.products.length ? 'Registra el próximo pedido que llegue del proveedor.' : 'Primero crea productos en Existencias.'}
                  />
                }
              />
            </Surface>
          </>
        )}
      </LoadGate>
      <LotForm open={formOpen} products={state.data?.products || []} initialProductId={product?.id} onClose={() => setFormOpen(false)} onSubmit={save} />
      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Lote ${selected.lotNumber}` : ''}
        subtitle={selected?.product.name}
        actions={
          selected &&
          isAdmin && (
            <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => remove(selected)}>
              Eliminar lote
            </Button>
          )
        }
      >
        {selected && (
          <>
            <DetailRow label="Producto">
              {selected.product.name} ({selected.product.sku})
            </DetailRow>
            <DetailRow label="Unidades">{selected.quantity}</DetailRow>
            <DetailRow label="Costo unitario">{formatCurrency(selected.unitCost)}</DetailRow>
            <DetailRow label="Costo total">{formatCurrency(selected.unitCost * selected.quantity)}</DetailRow>
            <DetailRow label="Proveedor">{selected.supplier || '—'}</DetailRow>
            <DetailRow label="Recibido">{formatDate(selected.receivedAt)}</DetailRow>
            <DetailRow label="Garantía">{warrantyChip(selected.warrantyUntil)}</DetailRow>
            <DetailRow label="Registrado por">{selected.createdBy || '—'}</DetailRow>
            {selected.notes && <DetailRow label="Notas">{selected.notes}</DetailRow>}
          </>
        )}
      </DetailDrawer>
    </>
  );
};

export default InventoryLots;
