import React, { useEffect, useState } from 'react';
import { Box, FormControlLabel, MenuItem, Switch, TextField, Typography } from '@mui/material';
import FormDialog, { FormGrid, Full } from '../shared/FormDialog';
import { ImageUpload, NumberField, SkuField } from '../shared/Fields';
import productsService, { CreateProductData, priceBeforeTax, priceWithTax, Product, ProductStatus } from '../../services/products.service';
import { productStatusLabel } from './useInventoryData';
import { formatCurrency } from '../../utils/format';
import { TAX_RATES, validateName, validateSku } from '../../utils/validation';

const UNITS = [
  { value: 'UND', label: 'Unidad' },
  { value: 'PAR', label: 'Par' },
  { value: 'KIT', label: 'Kit' },
  { value: 'JGO', label: 'Juego' },
  { value: 'MT', label: 'Metro' },
  { value: 'SERV', label: 'Servicio' }
];

interface FormState {
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number | null;
  priceIncludesTax: boolean;
  taxRate: number;
  unit: string;
  stock: number | null;
  minStock: number | null;
  imageUrl?: string;
  status: ProductStatus;
}

const empty = (category = ''): FormState => ({
  name: '',
  sku: '',
  category,
  description: '',
  price: null,
  priceIncludesTax: true,
  taxRate: 19,
  unit: 'UND',
  stock: null,
  minStock: null,
  imageUrl: undefined,
  status: 'active'
});

const ProductForm: React.FC<{
  open: boolean;
  product?: Product | null;
  categories: string[];
  uvt?: number;
  onClose: () => void;
  onSubmit: (data: CreateProductData) => Promise<void>;
}> = ({ open, product, categories, uvt = 52374, onClose, onSubmit }) => {
  const [form, setForm] = useState<FormState>(empty());
  const [errors, setErrors] = useState<Record<string, string | null>>({});
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
            priceIncludesTax: product.priceIncludesTax,
            taxRate: product.taxRate,
            unit: product.unit || 'UND',
            stock: product.stock,
            minStock: product.minStock || null,
            imageUrl: product.imageUrl,
            status: product.status || 'active'
          }
        : empty(categories[0])
    );
    setErrors({});
    setError(null);
  }, [open, product, categories]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const priced = { price: form.price || 0, taxRate: form.taxRate, priceIncludesTax: form.priceIncludesTax };
  const breakdown = form.price
    ? form.priceIncludesTax
      ? `Base ${formatCurrency(priceBeforeTax(priced))} + IVA ${formatCurrency(form.price - priceBeforeTax(priced))}`
      : `Precio al público: ${formatCurrency(priceWithTax(priced))}`
    : ' ';

  const submit = async () => {
    const next = {
      name: validateName(form.name),
      sku: validateSku(form.sku),
      category: form.category ? null : 'Elige una categoría',
      price: form.price !== null ? null : 'Escribe el precio'
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSubmitting(true);
    setError(null);
    try {
      const data: CreateProductData = {
        name: form.name.trim().replace(/\s+/g, ' '),
        sku: form.sku,
        category: form.category,
        description: form.description.trim(),
        price: form.price || 0,
        priceIncludesTax: form.priceIncludesTax,
        taxRate: form.taxRate,
        unit: form.unit,
        minStock: form.minStock || 0,
        imageUrl: form.imageUrl,
        status: form.status
      };
      if (!product) data.stock = form.stock || 0;
      await onSubmit(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const fiftyUvt = formatCurrency(uvt * 50);

  return (
    <FormDialog
      open={open}
      title={product ? 'Editar producto' : 'Nuevo producto'}
      submitLabel={product ? 'Guardar cambios' : 'Crear producto'}
      onClose={onClose}
      onSubmit={submit}
      submitting={submitting}
      error={error}
      maxWidth="md"
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '240px 1fr' }, gap: 3 }}>
        <Box>
          <ImageUpload value={form.imageUrl} onChange={(url) => set('imageUrl', url)} upload={productsService.uploadImage} />
        </Box>
        <FormGrid>
          <Full>
            <TextField label="Nombre" value={form.name} onChange={(e) => set('name', e.target.value)} error={!!errors.name} helperText={errors.name || ' '} autoFocus required inputProps={{ maxLength: 120 }} />
          </Full>
          <SkuField value={form.sku} onValueChange={(v) => set('sku', v)} error={!!errors.sku} helperText={errors.sku || 'Es el código que lee el escáner'} required />
          <TextField select label="Categoría" value={form.category} onChange={(e) => set('category', e.target.value)} error={!!errors.category} helperText={errors.category || ' '} required>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <NumberField
            label={form.priceIncludesTax ? 'Precio al público (IVA incluido)' : 'Precio antes de IVA'}
            money
            value={form.price}
            onValueChange={(v) => set('price', v)}
            error={!!errors.price}
            helperText={errors.price || breakdown}
            required
          />
          <TextField select label="Tarifa de IVA" value={form.taxRate} onChange={(e) => set('taxRate', Number(e.target.value))} helperText=" ">
            {TAX_RATES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          <Full>
            <FormControlLabel
              sx={{ mt: -1 }}
              control={<Switch checked={form.priceIncludesTax} onChange={(e) => set('priceIncludesTax', e.target.checked)} />}
              label="El precio que escribo ya incluye IVA"
            />
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
              Referencia (art. 424 y 468-1 del E.T.): bicicletas, patinetas y motos eléctricas de hasta 50 UVT ({fiftyUvt}) están excluidas; motos eléctricas de mayor
              valor, baterías y cargadores para vehículos eléctricos pagan 5 %; repuestos en general, 19 %. Confirma la tarifa con tu contador.
            </Typography>
          </Full>
          {!product && (
            <NumberField label="Stock inicial" value={form.stock} onValueChange={(v) => set('stock', v)} max={99999} helperText="Unidades que hay hoy en bodega" />
          )}
          <NumberField
            label="Stock mínimo"
            value={form.minStock}
            onValueChange={(v) => set('minStock', v)}
            max={99999}
            helperText="Por debajo de este número se genera una alerta"
          />
          <TextField select label="Unidad de medida" value={form.unit} onChange={(e) => set('unit', e.target.value)} helperText=" ">
            {UNITS.map((u) => (
              <MenuItem key={u.value} value={u.value}>
                {u.label}
              </MenuItem>
            ))}
          </TextField>
          {product && (
            <TextField select label="Estado" value={form.status} onChange={(e) => set('status', e.target.value as ProductStatus)} helperText={form.status === 'discontinued' ? 'No aparece al vender' : ' '}>
              {Object.entries(productStatusLabel).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  {v}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Full>
            <TextField label="Descripción" value={form.description} onChange={(e) => set('description', e.target.value)} multiline minRows={3} inputProps={{ maxLength: 600 }} />
          </Full>
        </FormGrid>
      </Box>
    </FormDialog>
  );
};

export default ProductForm;
