import React, { useEffect, useState } from 'react';
import { Grid, InputAdornment, MenuItem, TextField } from '@mui/material';
import FormDialog from '../shared/FormDialog';
import { CreateProductData, Product } from '../../services/products.service';
import { productStatusLabel } from './useInventoryData';

const empty = (category = ''): CreateProductData => ({
  name: '',
  sku: '',
  category,
  description: '',
  price: 0,
  stock: 0,
  minStock: 0,
  imageUrl: '',
  status: 'active'
});

const ProductForm: React.FC<{
  open: boolean;
  product?: Product | null;
  categories: string[];
  onClose: () => void;
  onSubmit: (data: CreateProductData) => Promise<void>;
}> = ({ open, product, categories, onClose, onSubmit }) => {
  const [form, setForm] = useState<CreateProductData>(empty());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      product
        ? {
            name: product.name,
            sku: product.sku,
            category: product.category,
            description: product.description || '',
            price: product.price,
            stock: product.stock,
            minStock: product.minStock,
            imageUrl: product.imageUrl || '',
            status: product.status || 'active'
          }
        : empty(categories[0])
    );
    setErrors({});
    setError(null);
  }, [open, product, categories]);

  const set = (k: keyof CreateProductData, numeric = false) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: numeric ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value }));

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Escribe el nombre';
    if (!form.sku.trim()) next.sku = 'Escribe el código';
    if (!form.category) next.category = 'Elige una categoría';
    if (!(form.price >= 0)) next.price = 'El precio no puede ser negativo';
    if (!Number.isInteger(form.stock) || form.stock < 0) next.stock = 'Usa un número entero positivo';
    if (!Number.isInteger(form.minStock) || form.minStock < 0) next.minStock = 'Usa un número entero positivo';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = { ...form, name: form.name.trim(), sku: form.sku.trim() };
      if (product) delete (data as Partial<CreateProductData>).stock;
      await onSubmit(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title={product ? 'Editar producto' : 'Nuevo producto'}
      submitLabel={product ? 'Guardar cambios' : 'Crear producto'}
      onClose={onClose}
      onSubmit={submit}
      submitting={submitting}
      error={error}
    >
      <TextField label="Nombre" value={form.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} autoFocus required />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="SKU o código de barras"
            value={form.sku}
            onChange={set('sku')}
            error={!!errors.sku}
            helperText={errors.sku || 'Es el código que lee el escáner'}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select label="Categoría" value={form.category} onChange={set('category')} error={!!errors.category} helperText={errors.category} required>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Precio de venta"
            type="number"
            value={form.price || ''}
            onChange={set('price', true)}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, inputProps: { min: 0 } }}
            error={!!errors.price}
            helperText={errors.price}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select label="Estado" value={form.status} onChange={set('status')}>
            {Object.entries(productStatusLabel).map(([k, v]) => (
              <MenuItem key={k} value={k}>
                {v}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        {!product && (
          <Grid item xs={12} sm={6}>
            <TextField
              label="Stock inicial"
              type="number"
              value={form.stock}
              onChange={set('stock', true)}
              InputProps={{ inputProps: { min: 0, step: 1 } }}
              error={!!errors.stock}
              helperText={errors.stock || 'Después, el stock cambia con ventas, lotes y ajustes'}
            />
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Stock mínimo"
            type="number"
            value={form.minStock}
            onChange={set('minStock', true)}
            InputProps={{ inputProps: { min: 0, step: 1 } }}
            error={!!errors.minStock}
            helperText={errors.minStock || 'Por debajo de este número se genera una alerta'}
          />
        </Grid>
      </Grid>
      <TextField label="URL de la imagen" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://…" />
      <TextField label="Descripción" value={form.description} onChange={set('description')} multiline minRows={3} />
    </FormDialog>
  );
};

export default ProductForm;
