import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import FormDialog, { FormGrid, Full } from '../shared/FormDialog';
import { NumberField } from '../shared/Fields';
import { matches } from '../../utils/text';
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
  const [form, setForm] = useState({ lotNumber: '', quantity: null as number | null, unitCost: null as number | null, supplier: '', receivedAt: '', warrantyUntil: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const productsRef = useRef(products);
  productsRef.current = products;

  // Solo se reinicia al abrir, aunque la lista de productos se recargue mientras está abierto
  useEffect(() => {
    if (!open) return;
    setProduct(productsRef.current.find((p) => p.id === initialProductId) || null);
    setForm({ lotNumber: suggestLotNumber(), quantity: null, unitCost: null, supplier: '', receivedAt: toInputDate(new Date()), warrantyUntil: '', notes: '' });
    setErrors({});
    setError(null);
  }, [open, initialProductId]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!product) next.product = 'Elige el producto que llegó';
    if (!form.lotNumber.trim()) next.lotNumber = 'Escribe el número de lote';
    if (!form.quantity || form.quantity < 1) next.quantity = 'Escribe cuántas unidades llegaron';
    if (form.receivedAt && form.receivedAt > toInputDate(new Date())) next.receivedAt = 'No puede ser una fecha futura';
    if (form.warrantyUntil && form.receivedAt && form.warrantyUntil < form.receivedAt) next.warrantyUntil = 'Debe ser posterior a la recepción';
    setErrors(next);
    if (Object.keys(next).length || !product) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        productId: product.id,
        lotNumber: form.lotNumber.trim(),
        quantity: form.quantity || 0,
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
      <FormGrid>
        <Full>
          <Autocomplete<Product>
            options={products.filter((p) => p.status !== 'discontinued')}
            value={product}
            onChange={(_, p) => setProduct(p)}
            getOptionLabel={(p) => `${p.name} (${p.sku})`}
            filterOptions={(opts, { inputValue }) => opts.filter((p) => matches(inputValue, p.name, p.sku))}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(p) => <TextField {...p} label="Producto" error={!!errors.product} helperText={errors.product || (product ? `Stock actual: ${product.stock} u.` : ' ')} required autoFocus />}
            noOptionsText="Ningún producto coincide"
          />
        </Full>
        <TextField label="Número de lote" value={form.lotNumber} onChange={(e) => setForm((f) => ({ ...f, lotNumber: e.target.value.toUpperCase() }))} error={!!errors.lotNumber} helperText={errors.lotNumber || ' '} required inputProps={{ maxLength: 40 }} />
        <NumberField label="Unidades recibidas" value={form.quantity} onValueChange={(v) => setForm((f) => ({ ...f, quantity: v }))} max={99999} error={!!errors.quantity} helperText={errors.quantity || ' '} required />
        <NumberField label="Costo unitario" money value={form.unitCost} onValueChange={(v) => setForm((f) => ({ ...f, unitCost: v }))} helperText="Antes de IVA" />
        <TextField label="Proveedor" value={form.supplier} onChange={set('supplier')} helperText=" " inputProps={{ maxLength: 80 }} />
        <TextField label="Fecha de recepción" type="date" value={form.receivedAt} onChange={set('receivedAt')} InputLabelProps={{ shrink: true }} error={!!errors.receivedAt} helperText={errors.receivedAt || ' '} inputProps={{ max: toInputDate(new Date()) }} />
        <TextField label="Garantía hasta" type="date" value={form.warrantyUntil} onChange={set('warrantyUntil')} InputLabelProps={{ shrink: true }} error={!!errors.warrantyUntil} helperText={errors.warrantyUntil || 'Útil para baterías y vehículos'} />
        <Full>
          <TextField label="Notas" value={form.notes} onChange={set('notes')} multiline minRows={2} />
        </Full>
      </FormGrid>
    </FormDialog>
  );
};

export default LotForm;
