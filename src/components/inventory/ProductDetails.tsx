import React, { useEffect, useState } from 'react';
import { Box, Button, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import DetailDrawer, { DetailRow } from '../shared/DetailDrawer';
import ChargeMeter, { stockLevel } from '../shared/ChargeMeter';
import StatusChip from '../shared/StatusChip';
import ProductThumb from './ProductThumb';
import { productStatusLabel } from './useInventoryData';
import productsService, { movementReasonLabel, Product, StockMovement } from '../../services/products.service';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDateTime } from '../../utils/format';

type AdjustMode = 'add' | 'remove' | 'set';

export const MovementList: React.FC<{ movements: StockMovement[]; showProduct?: boolean }> = ({ movements, showProduct }) =>
  movements.length === 0 ? (
    <Typography variant="body2" color="text.secondary">
      Sin movimientos registrados.
    </Typography>
  ) : (
    <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
      {movements.map((m) => {
        const signed = m.type === 'adjust' ? m.quantity : m.type === 'in' ? m.quantity : -m.quantity;
        return (
          <Box key={m.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1.25 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {showProduct ? m.product?.name || 'Producto eliminado' : movementReasonLabel[m.reason]}
                {m.reference && (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {m.reference}
                  </Typography>
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div" noWrap>
                {showProduct ? `${movementReasonLabel[m.reason]}, ` : ''}
                {formatDateTime(m.createdAt)}
                {m.note ? ` (${m.note})` : ''}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: signed > 0 ? 'success.main' : signed < 0 ? 'error.main' : 'text.primary' }}>
                {signed > 0 ? '+' : ''}
                {signed}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Quedan {m.stockAfter}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );

const ProductDetails: React.FC<{
  product: Product | null;
  threshold: number;
  onClose: () => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onReceiveLot: (p: Product) => void;
  onChanged: (p: Product) => void;
}> = ({ product, threshold, onClose, onEdit, onDelete, onReceiveLot, onChanged }) => {
  const { notify } = useUI();
  const { isAdmin } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [mode, setMode] = useState<AdjustMode>('add');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setQty('');
    setNote('');
    setMode('add');
    if (product) productsService.getMovements(product.id).then(setMovements).catch(() => setMovements([]));
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!product) return <DetailDrawer open={false} onClose={onClose} title="">{null}</DetailDrawer>;

  const min = product.minStock > 0 ? product.minStock : threshold;
  const level = stockLevel(product.stock, product.minStock, threshold);
  const n = Number(qty);
  const valid = qty !== '' && Number.isInteger(n) && (mode === 'set' ? n >= 0 : n > 0);
  const preview = !valid ? null : mode === 'set' ? n : mode === 'add' ? product.stock + n : product.stock - n;

  const apply = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const updated =
        mode === 'set'
          ? await productsService.updateStock(product.id, n, note || 'Conteo físico')
          : await productsService.moveStock(product.id, mode === 'add' ? n : -n, note || undefined);
      onChanged(updated);
      setMovements(await productsService.getMovements(product.id));
      setQty('');
      setNote('');
      notify(`Stock actualizado: ${updated.stock} u.`);
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DetailDrawer
      open
      onClose={onClose}
      title={product.name}
      subtitle={`${product.sku}, ${product.category}`}
      width={500}
      actions={
        <>
          <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => onEdit(product)}>
            Editar
          </Button>
          <Button variant="outlined" startIcon={<MoveToInboxOutlinedIcon />} onClick={() => onReceiveLot(product)}>
            Registrar lote
          </Button>
          {isAdmin && (
            <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => onDelete(product)}>
              Eliminar
            </Button>
          )}
        </>
      }
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
        <ProductThumb imageUrl={product.imageUrl} category={product.category} size={72} radius={3} />
        <Box>
          <Typography variant="h2" component="p">
            {product.stock} <Typography component="span" color="text.secondary">unidades</Typography>
          </Typography>
          <ChargeMeter value={product.stock / (min * 3)} level={level} width={180} height={16} />
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
            {level === 'empty' ? 'Agotado. ' : level === 'low' ? 'En o bajo el mínimo. ' : ''}Mínimo: {min} u.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Ajustar stock
        </Typography>
        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && setMode(v)} fullWidth sx={{ mb: 1.5 }}>
          <ToggleButton value="add">Sumar</ToggleButton>
          <ToggleButton value="remove">Restar</ToggleButton>
          <ToggleButton value="set">Fijar conteo</ToggleButton>
        </ToggleButtonGroup>
        <Stack direction="row" spacing={1}>
          <TextField
            label={mode === 'set' ? 'Unidades contadas' : 'Unidades'}
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            InputProps={{ inputProps: { min: 0, step: 1 } }}
            sx={{ maxWidth: 140 }}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
          />
          <TextField label="Motivo (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
          <Typography variant="body2" color={preview !== null && preview < 0 ? 'error' : 'text.secondary'}>
            {preview === null ? ' ' : preview < 0 ? 'No hay unidades suficientes' : `Quedarán ${preview} u.`}
          </Typography>
          <Button variant="contained" onClick={apply} disabled={!valid || saving || (preview !== null && preview < 0)}>
            Aplicar
          </Button>
        </Box>
      </Box>

      <DetailRow label="Precio">{formatCurrency(product.price)}</DetailRow>
      <DetailRow label="Valor en stock">{formatCurrency(product.price * product.stock)}</DetailRow>
      <DetailRow label="Estado">
        <StatusChip label={productStatusLabel[product.status] || product.status} tone={product.status === 'active' ? 'ok' : 'neutral'} />
      </DetailRow>
      {product.description && <DetailRow label="Descripción">{product.description}</DetailRow>}

      <Typography variant="h5" sx={{ mt: 4, mb: 1 }}>
        Movimientos
      </Typography>
      <MovementList movements={movements.slice(0, 12)} />
    </DetailDrawer>
  );
};

export default ProductDetails;
