import React, { useMemo, useState } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { EmptyState, LoadGate, PageHeader, StatStrip, Surface } from '../shared/Page';
import DataTable, { Column } from '../shared/DataTable';
import SearchField from '../shared/SearchField';
import StatusChip from '../shared/StatusChip';
import { StockMeter, stockLevel } from '../shared/ChargeMeter';
import ProductThumb from './ProductThumb';
import { NO_CATEGORIES, NO_PRODUCTS, productStatusLabel, useInventoryData } from './useInventoryData';
import { useProductActions } from './useProductActions';
import { Product } from '../../services/products.service';
import { formatCurrency, formatNumber } from '../../utils/format';
import { downloadCsv } from '../../utils/csv';
import { matches } from '../../utils/text';
import { priceBeforeTax, priceWithTax } from '../../services/products.service';

const InventoryData: React.FC = () => {
  const state = useInventoryData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const products = state.data?.products ?? NO_PRODUCTS;
  const threshold = state.data?.settings.lowStockThreshold ?? 5;
  const actions = useProductActions({ products, categories: state.data?.categories ?? NO_CATEGORIES, threshold, uvt: state.data?.uvt, reload: state.reload });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => (!category || p.category === category) && matches(q, p.name, p.sku, p.category));
  }, [products, search, category]);

  const totals = useMemo(() => {
    const units = products.reduce((s, p) => s + p.stock, 0);
    const value = products.reduce((s, p) => s + p.stock * priceBeforeTax(p), 0);
    const alerts = products.filter((p) => p.status !== 'discontinued' && stockLevel(p.stock, p.minStock, threshold) !== 'ok').length;
    return { units, value, alerts };
  }, [products, threshold]);

  const columns: Column<Product>[] = [
    {
      key: 'name',
      label: 'Producto',
      sortValue: (p) => p.name,
      render: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <ProductThumb imageUrl={p.imageUrl} category={p.category} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {p.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              {p.sku}
            </Typography>
          </Box>
        </Box>
      )
    },
    { key: 'category', label: 'Categoría', sortValue: (p) => p.category, render: (p) => p.category, hideBelow: 'md' },
    {
      key: 'price',
      label: 'Precio con IVA',
      align: 'right',
      sortValue: (p) => priceWithTax(p),
      render: (p) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(priceWithTax(p))}</Typography>
          <Typography variant="caption" color="text.secondary">IVA {p.taxRate} %</Typography>
        </Box>
      )
    },
    {
      key: 'stock',
      label: 'Stock',
      sortValue: (p) => p.stock,
      render: (p) => <StockMeter stock={p.stock} minStock={p.minStock} threshold={threshold} width={80} />
    },
    { key: 'value', label: 'Valor en stock', align: 'right', sortValue: (p) => p.stock * priceBeforeTax(p), render: (p) => formatCurrency(p.stock * priceBeforeTax(p)), hideBelow: 'lg' },
    {
      key: 'status',
      label: 'Estado',
      render: (p) => <StatusChip label={productStatusLabel[p.status] || p.status} tone={p.status === 'active' ? 'ok' : 'neutral'} />,
      hideBelow: 'md'
    }
  ];

  const exportCsv = () =>
    downloadCsv(
      'inventario-battiolab.csv',
      ['SKU', 'Producto', 'Categoría', 'Precio antes de IVA', 'IVA %', 'Precio con IVA', 'Stock', 'Stock mínimo', 'Valor en stock', 'Estado'],
      rows.map((p) => [p.sku, p.name, p.category, priceBeforeTax(p), p.taxRate, priceWithTax(p), p.stock, p.minStock, priceBeforeTax(p) * p.stock, productStatusLabel[p.status] || p.status])
    );

  return (
    <>
      <PageHeader
        title="Existencias"
        description="Cuánto hay de cada producto y cuánto vale. Toca una fila para ajustar el stock."
        actions={
          <>
            <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} disabled={!rows.length}>
              Exportar CSV
            </Button>
            <Button variant="outlined" startIcon={<MoveToInboxOutlinedIcon />} onClick={() => actions.openLot()} disabled={!products.length}>
              Registrar lote
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={actions.openNew}>
              Nuevo producto
            </Button>
          </>
        }
      />
      <LoadGate state={state}>
        {(data) => (
          <>
            <StatStrip
              stats={[
                { label: 'Productos', value: formatNumber(products.length) },
                { label: 'Unidades en bodega', value: formatNumber(totals.units) },
                { label: 'Valor del inventario', value: formatCurrency(totals.value), hint: 'A precio de venta antes de IVA' },
                { label: 'En alerta', value: totals.alerts, hint: totals.alerts ? 'Agotados o bajo el mínimo' : 'Todo en orden' }
              ]}
            />
            <Surface padding={0}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2.5, alignItems: { md: 'center' } }}>
                <SearchField value={search} onChange={setSearch} placeholder="Buscar por nombre, SKU o categoría" />
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Chip label="Todas" onClick={() => setCategory(null)} color={!category ? 'primary' : 'default'} variant={!category ? 'filled' : 'outlined'} />
                  {data.categories.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      onClick={() => setCategory((v) => (v === c ? null : c))}
                      color={category === c ? 'primary' : 'default'}
                      variant={category === c ? 'filled' : 'outlined'}
                    />
                  ))}
                </Stack>
              </Stack>
              <DataTable
                rows={rows}
                columns={columns}
                rowKey={(p) => p.id}
                onRowClick={actions.openDetails}
                initialSort={{ key: 'name', dir: 'asc' }}
                empty={
                  products.length === 0 ? (
                    <EmptyState
                      icon={<Inventory2OutlinedIcon />}
                      title="El inventario está vacío"
                      text="Crea tu primer producto: un scooter, una batería o un repuesto."
                      action={
                        <Button variant="contained" startIcon={<AddIcon />} onClick={actions.openNew}>
                          Nuevo producto
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState title="Ningún producto coincide" text="Prueba con otro término o cambia la categoría." />
                  )
                }
              />
            </Surface>
          </>
        )}
      </LoadGate>
      {actions.dialogs}
    </>
  );
};

export default InventoryData;
