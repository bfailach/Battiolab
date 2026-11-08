import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { EmptyState, LoadGate, PageHeader, Surface } from '../shared/Page';
import { StockMeter, stockLevel } from '../shared/ChargeMeter';
import ProductThumb from './ProductThumb';
import { NO_CATEGORIES, NO_PRODUCTS, useInventoryData } from './useInventoryData';
import { useProductActions } from './useProductActions';
import { Product } from '../../services/products.service';
import settingsService from '../../services/settings.service';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

const AlertRow: React.FC<{ product: Product; threshold: number; onOpen: () => void; onLot: () => void }> = ({ product, threshold, onOpen, onLot }) => {
  const min = product.minStock > 0 ? product.minStock : threshold;
  const missing = Math.max(0, min * 2 - product.stock);
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) 150px 210px auto' },
        alignItems: 'center',
        gap: 2,
        py: 1.75,
        px: 2.5,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === 'Enter' && onOpen()}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, cursor: 'pointer' }}
      >
        <ProductThumb imageUrl={product.imageUrl} category={product.category} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {product.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {product.sku}, {product.category}
          </Typography>
        </Box>
      </Box>
      <StockMeter stock={product.stock} minStock={product.minStock} threshold={threshold} />
      <Typography variant="body2" color="text.secondary">
        Mínimo {min} u. Sugerido pedir: <strong>{missing} u.</strong>
      </Typography>
      <Button size="small" variant="outlined" startIcon={<MoveToInboxOutlinedIcon />} onClick={onLot}>
        Registrar lote
      </Button>
    </Box>
  );
};

const InventoryAlerts: React.FC = () => {
  const { notify } = useUI();
  const { isAdmin } = useAuth();
  const state = useInventoryData();
  const products = state.data?.products ?? NO_PRODUCTS;
  const threshold = state.data?.settings.lowStockThreshold ?? 5;
  const actions = useProductActions({ products, categories: state.data?.categories ?? NO_CATEGORIES, threshold, uvt: state.data?.uvt, reload: state.reload });
  const [draftThreshold, setDraftThreshold] = useState('');

  useEffect(() => setDraftThreshold(String(threshold)), [threshold]);

  const { empty, low } = useMemo(() => {
    const active = products.filter((p) => p.status !== 'discontinued');
    return {
      empty: active.filter((p) => stockLevel(p.stock, p.minStock, threshold) === 'empty'),
      low: active.filter((p) => stockLevel(p.stock, p.minStock, threshold) === 'low').sort((a, b) => a.stock - b.stock)
    };
  }, [products, threshold]);

  const saveThreshold = async () => {
    const n = Number(draftThreshold);
    if (!Number.isInteger(n) || n < 0) {
      notify('El umbral debe ser un número entero positivo', 'error');
      return;
    }
    try {
      await settingsService.save('inventory', { lowStockThreshold: n });
      notify('Umbral guardado');
      state.reload();
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };

  const section = (title: string, subtitle: string, list: Product[]) =>
    list.length > 0 && (
      <Surface title={`${title} (${list.length})`} subtitle={subtitle} padding={0} sx={{ mb: 3 }}>
        <Box>
          {list.map((p) => (
            <AlertRow key={p.id} product={p} threshold={threshold} onOpen={() => actions.openDetails(p)} onLot={() => actions.openLot(p)} />
          ))}
        </Box>
      </Surface>
    );

  return (
    <>
      <PageHeader title="Alertas de stock" description="Productos agotados o en su mínimo. Registra un lote cuando llegue el pedido." />
      <LoadGate state={state}>
        {() => (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 300px' }, gap: 3, alignItems: 'start' }}>
            <Box>
              {empty.length + low.length === 0 ? (
                <Surface>
                  <EmptyState
                    icon={<TaskAltOutlinedIcon />}
                    title="Todo el inventario está cargado"
                    text="Ningún producto activo está agotado ni por debajo de su mínimo."
                  />
                </Surface>
              ) : (
                <>
                  {section('Agotados', 'No se pueden vender hasta que entre mercancía.', empty)}
                  {section('Bajo el mínimo', 'Todavía hay unidades, pero conviene pedir pronto.', low)}
                </>
              )}
            </Box>
            <Surface title="Regla de alerta">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Cada producto alerta al llegar a su stock mínimo. Si no tiene mínimo, se usa este umbral general.
              </Typography>
              {isAdmin ? (
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Umbral general"
                    type="number"
                    value={draftThreshold}
                    onChange={(e) => setDraftThreshold(e.target.value)}
                    InputProps={{ endAdornment: <InputAdornment position="end">u.</InputAdornment>, inputProps: { min: 0 } }}
                  />
                  <Button variant="contained" onClick={saveThreshold} disabled={draftThreshold === String(threshold)}>
                    Guardar
                  </Button>
                </Stack>
              ) : (
                <Alert severity="info">Umbral general: {threshold} u. Solo un administrador puede cambiarlo.</Alert>
              )}
            </Surface>
          </Box>
        )}
      </LoadGate>
      {actions.dialogs}
    </>
  );
};

export default InventoryAlerts;
