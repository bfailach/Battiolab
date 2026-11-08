import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, Grid, InputAdornment, TextField } from '@mui/material';
import FormDialog from '../shared/FormDialog';
import { Product } from '../../services/products.service';
import { CreateLotData } from '../../services/lots.service';
import { toInputDate } from '../../utils/format';

const suggestLotNumber = () => {
  const d = new Date();
  return `L${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(
    Math.floor(Math.random() * 900) + 100
  )}`;
};

/** Registrar un lote recibido: suma sus unidades al stock del producto. */
const LotForm: React.FC<{
  open: boolean;
  products: Product[];
  initialProductId?: string | null;
  onClose: () => void;
  onSubmit: (data: CreateLotData) => Promise<void>;
}> = ({ open, products, initialProductId, onClose, onSubmit }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ lotNumber: '', quantity: 1, unitCost: 0, supplier: '', receivedAt: '', warrantyUntil: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const productsRef = useRef(products);
  productsRef.current = products;

  // Solo se reinicia al abrir, aunque la lista de productos se recargue mientras está abierto
  useEffect(() => {
    if (!open) return;
    setProduct(productsRef.current.find((p) => p.id === initialProductId) || null);
    setForm({ lotNumber: suggestLotNumber(), quantity: 1, unitCost: 0, supplier: '', receivedAt: toInputDate(new Date()), warrantyUntil: '', notes: '' });
    setErrors({});
    setError(null);
  }, [open, initialProductId]);

  const set = (k: keyof typeof form, numeric = false) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: numeric ? Number(e.target.value) : e.target.value }));

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!product) next.product = 'Elige el producto que llegó';
    if (!form.lotNumber.trim()) next.lotNumber = 'Escribe el número de lote';
    if (!Number.isInteger(form.quantity) || form.quantity < 1) next.quantity = 'Debe ser un entero mayor a 0';
    setErrors(next);
    if (Object.keys(next).length || !product) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        productId: product.id,
        lotNumber: form.lotNumber.trim(),
        quantity: form.quantity,
        unitCost: form.unitCost || 0,
        supplier: form.supplier.trim() || undefined,
        receivedAt: form.receivedAt || undefined,
        warrantyUntil: form.warrantyUntil || undefined,
        notes: form.notes.trim() || undefined
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog open={open} title="Registrar lote recibido" submitLabel="Registrar lote" onClose={onClose} onSubmit={submit} submitting={submitting} error={error}>
      <Autocomplete<Product>
        options={products}
        value={product}
        onChange={(_, p) => setProduct(p)}
        getOptionLabel={(p) => `${p.name} (${p.sku})`}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        renderInput={(p) => <TextField {...p} label="Producto" error={!!errors.product} helperText={errors.product || (product ? `Stock actual: ${product.stock} u.` : ' ')} required autoFocus />}
        noOptionsText="Ningún producto coincide"
      />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Número de lote" value={form.lotNumber} onChange={set('lotNumber')} error={!!errors.lotNumber} helperText={errors.lotNumber} required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Unidades recibidas"
            type="number"
            value={form.quantity || ''}
            onChange={set('quantity', true)}
            InputProps={{ inputProps: { min: 1, step: 1 } }}
            error={!!errors.quantity}
            helperText={errors.quantity}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Costo unitario"
            type="number"
            value={form.unitCost || ''}
            onChange={set('unitCost', true)}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, inputProps: { min: 0 } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Proveedor" value={form.supplier} onChange={set('supplier')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Fecha de recepción" type="date" value={form.receivedAt} onChange={set('receivedAt')} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Garantía hasta"
            type="date"
            value={form.warrantyUntil}
            onChange={set('warrantyUntil')}
            InputLabelProps={{ shrink: true }}
            helperText="Útil para baterías y vehículos"
          />
        </Grid>
      </Grid>
      <TextField label="Notas" value={form.notes} onChange={set('notes')} multiline minRows={2} />
    </FormDialog>
  );
};

export default LotForm;
