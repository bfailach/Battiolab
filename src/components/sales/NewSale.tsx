import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { LoadGate, PageHeader, Surface } from '../shared/Page';
import SearchField from '../shared/SearchField';
import { NumberField } from '../shared/Fields';
import { StockMeter } from '../shared/ChargeMeter';
import ProductThumb from '../inventory/ProductThumb';
import ClientForm from '../clients/ClientForm';
import InvoiceDialog from '../invoice/InvoiceDialog';
import clientsService, { Client, CreateClientData } from '../../services/clients.service';
import productsService, { lineAmounts, priceWithTax, Product } from '../../services/products.service';
import salesService, { PaymentForm, Sale } from '../../services/sales.service';
import settingsService, { SalesSettings } from '../../services/settings.service';
import { useLoad } from '../../hooks/useLoad';
import { useUI } from '../../contexts/UIContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { docLabel, formatDocument } from '../../utils/validation';
import { matches } from '../../utils/text';
import { brand, wide } from '../../theme';

interface Line {
  product: Product;
  quantity: number;
  price: number;
}

const defaults: SalesSettings = {
  invoicePrefix: '',
  creditNotePrefix: 'NC-',
  defaultCreditDays: 30,
  defaultStatus: 'completed',
  paymentMethods: ['Efectivo'],
  allowNegativeStock: false
};

const NewSale: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { notify } = useUI();
  const state = useLoad(async () => {
    const [clients, products, settings, finalConsumer] = await Promise.all([
      clientsService.getAll(),
      productsService.getAll(),
      settingsService.get('sales').catch(() => defaults),
      clientsService.getFinalConsumer()
    ]);
    return { clients, products, settings, finalConsumer };
  });

  const [client, setClient] = useState<Client | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<PaymentForm>('contado');
  const [payment, setPayment] = useState('');
  const [creditDays, setCreditDays] = useState<number | null>(30);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [done, setDone] = useState<Sale | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  useEffect(() => {
    if (!state.data) return;
    const { settings, clients } = state.data;
    setPayment((p) => p || settings.paymentMethods[0] || '');
    setCreditDays(settings.defaultCreditDays || 30);
    const pre = params.get('client');
    if (pre) setClient((c) => c || clients.find((x) => x.id === pre) || null);
  }, [state.data, params]);

  const settings = state.data?.settings || defaults;
  const allowNegative = settings.allowNegativeStock;
  const isFinalConsumer = !!client?.isFinalConsumer;

  const results = useMemo(
    () =>
      (state.data?.products || [])
        .filter((p) => p.status === 'active')
        .filter((p) => matches(search, p.name, p.sku, p.category))
        .slice(0, 14),
    [state.data, search]
  );

  const add = (product: Product) => {
    setError(null);
    setLines((ls) => {
      const existing = ls.find((l) => l.product.id === product.id);
      if (existing) return ls.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...ls, { product, quantity: 1, price: product.price }];
    });
  };
  const setQty = (id: string, q: number) => setLines((ls) => ls.map((l) => (l.product.id === id ? { ...l, quantity: Math.max(1, Math.min(9999, Math.floor(q) || 1)) } : l)));
  const setPrice = (id: string, p: number | null) => setLines((ls) => ls.map((l) => (l.product.id === id ? { ...l, price: p ?? 0 } : l)));
  const remove = (id: string) => setLines((ls) => ls.filter((l) => l.product.id !== id));

  const calc = useMemo(() => {
    const items = lines.map((l) => ({ ...l, ...lineAmounts(l.product, l.price, l.quantity) }));
    const byRate = new Map<number, { base: number; amount: number }>();
    items.forEach((i) => {
      const b = byRate.get(i.product.taxRate) || { base: 0, amount: 0 };
      b.base += i.subtotal;
      b.amount += i.tax;
      byRate.set(i.product.taxRate, b);
    });
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const tax = items.reduce((s, i) => s + i.tax, 0);
    return { items, subtotal, tax, total: subtotal + tax, taxes: [...byRate.entries()].sort((a, b) => b[0] - a[0]) };
  }, [lines]);

  const short = !allowNegative ? lines.filter((l) => l.quantity > l.product.stock) : [];
  const dueDate = new Date(Date.now() + (creditDays || 0) * 86400000);

  const submit = async () => {
    if (!client) return setError('Elige el cliente o usa "Consumidor final"');
    if (!lines.length) return setError('Agrega al menos un producto');
    if (short.length) return setError(`No hay stock suficiente de: ${short.map((l) => l.product.name).join(', ')}`);
    if (form === 'contado' && !payment) return setError('Elige el medio de pago');
    if (form === 'credito' && (!creditDays || creditDays < 1)) return setError('Indica el plazo del crédito en días');
    setSubmitting(true);
    setError(null);
    try {
      const sale = await salesService.create({
        client: { id: client.id },
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity, price: l.price })),
        paymentForm: form,
        paymentMethod: form === 'contado' ? payment : undefined,
        creditDays: form === 'credito' ? creditDays || 30 : undefined,
        notes: notes.trim() || undefined
      });
      setDone(sale);
      notify(`Factura ${sale.number} registrada`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(null);
    setLines([]);
    setClient(null);
    setNotes('');
    setSearch('');
    setForm('contado');
    state.reload();
  };

  const createClient = async (data: CreateClientData) => {
    const c = await clientsService.create(data);
    state.setData((d) => (d ? { ...d, clients: [c, ...d.clients] } : d));
    setClient(c);
    setClientFormOpen(false);
    notify('Cliente creado');
  };

  if (done) {
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto', mt: { md: 8 } }}>
        <CheckCircleIcon sx={{ fontSize: 56, color: brand.charge }} />
        <Typography variant="h1" component="h1" sx={{ mt: 2 }}>
          Factura {done.number}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: '1.0625rem' }}>
          {done.client.name}, {formatCurrency(done.total)}.{' '}
          {done.paymentForm === 'credito' ? `A crédito, vence el ${formatDate(done.dueDate)}.` : `Pagada con ${done.paymentMethod?.toLowerCase()}.`} El inventario ya se descontó.
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 4, flexWrap: 'wrap' }}>
          <Button variant="contained" color="charge" size="large" startIcon={<DescriptionOutlinedIcon />} onClick={() => setInvoiceOpen(true)}>
            Ver e imprimir factura
          </Button>
          <Button variant="outlined" size="large" startIcon={<AddIcon />} onClick={reset}>
            Otra venta
          </Button>
          <Button color="inherit" size="large" onClick={() => navigate('/dashboard/sales/list')}>
            Ver facturas
          </Button>
        </Stack>
        <InvoiceDialog sale={invoiceOpen ? done : null} onClose={() => setInvoiceOpen(false)} />
      </Box>
    );
  }

  return (
    <>
      <PageHeader title="Nueva venta" description="Elige el cliente, agrega productos y confirma. Al registrar se emite la factura y se descuenta el inventario." />
      <LoadGate state={state}>
        {(data) => (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 440px' }, gap: 3, alignItems: 'start' }}>
            <Stack spacing={3}>
              <Surface title="Cliente">
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <Autocomplete<Client>
                    options={[data.finalConsumer, ...data.clients.filter((c) => c.status)]}
                    value={client}
                    onChange={(_, c) => {
                      setClient(c);
                      setError(null);
                      if (c?.isFinalConsumer) setForm('contado');
                    }}
                    getOptionLabel={(c) => (c.isFinalConsumer ? 'Consumidor final' : `${c.name} (${docLabel(c.documentType)} ${formatDocument(c.documentType, c.document, c.checkDigit)})`)}
                    filterOptions={(opts, { inputValue }) => opts.filter((c) => matches(inputValue, c.name, c.document, c.email, c.phone))}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    renderInput={(p) => <TextField {...p} label="Buscar cliente" placeholder="Nombre, documento o teléfono" />}
                    noOptionsText="Ningún cliente activo coincide"
                    sx={{ flex: 1 }}
                  />
                  <Button variant="outlined" startIcon={<PersonOutlineIcon />} onClick={() => setClient(data.finalConsumer)} sx={{ flexShrink: 0 }}>
                    Consumidor final
                  </Button>
                  <Button variant="outlined" startIcon={<PersonAddAlt1OutlinedIcon />} onClick={() => setClientFormOpen(true)} sx={{ flexShrink: 0 }}>
                    Cliente nuevo
                  </Button>
                </Stack>
              </Surface>

              <Surface title="Productos" action={<SearchField value={search} onChange={setSearch} placeholder="Buscar producto o SKU" maxWidth={260} />}>
                {results.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Ningún producto activo coincide con la búsqueda.
                  </Typography>
                ) : (
                  <Stack divider={<Divider />}>
                    {results.map((p) => {
                      const inCart = lines.find((l) => l.product.id === p.id)?.quantity || 0;
                      const out = !allowNegative && p.stock - inCart <= 0;
                      return (
                        <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.25 }}>
                          <ProductThumb imageUrl={p.imageUrl} category={p.category} size={48} radius={3} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                              {p.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {p.sku}, {formatCurrency(priceWithTax(p))} con IVA {p.taxRate} %
                            </Typography>
                          </Box>
                          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <StockMeter stock={p.stock} minStock={p.minStock} width={60} />
                          </Box>
                          <Tooltip title={out ? 'Sin unidades disponibles' : ''}>
                            <span>
                              <Button size="small" variant={inCart ? 'contained' : 'outlined'} startIcon={<AddIcon />} onClick={() => add(p)} disabled={out}>
                                {inCart ? `${inCart} en la venta` : 'Agregar'}
                              </Button>
                            </span>
                          </Tooltip>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Surface>
            </Stack>

            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 100 } }}>
              <Surface
                title="Resumen"
                subtitle={client ? (isFinalConsumer ? 'Consumidor final' : `${client.name}, ${docLabel(client.documentType)} ${formatDocument(client.documentType, client.document, client.checkDigit)}`) : 'Sin cliente seleccionado'}
              >
                {lines.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <ShoppingCartOutlinedIcon />
                    <Typography variant="body2">Agrega productos desde la lista.</Typography>
                  </Box>
                ) : (
                  <Stack divider={<Divider />} sx={{ mb: 2 }}>
                    {calc.items.map((l) => {
                      const over = !allowNegative && l.quantity > l.product.stock;
                      return (
                        <Box key={l.product.id} sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {l.product.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Precio {l.product.priceIncludesTax ? 'con' : 'sin'} IVA. IVA {l.product.taxRate} %: {formatCurrency(l.tax)}
                              </Typography>
                            </Box>
                            <IconButton size="small" onClick={() => remove(l.product.id)} aria-label={`Quitar ${l.product.name}`}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'surface.raised', border: '1px solid', borderColor: over ? 'error.main' : 'divider', borderRadius: 999 }}>
                              <IconButton size="small" onClick={() => setQty(l.product.id, l.quantity - 1)} aria-label="Restar una unidad" disabled={l.quantity <= 1}>
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Box
                                component="input"
                                inputMode="numeric"
                                value={l.quantity}
                                aria-label={`Cantidad de ${l.product.name}`}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQty(l.product.id, Number(e.target.value.replace(/\D/g, '')))}
                                sx={{ width: 36, textAlign: 'center', border: 0, bgcolor: 'transparent', color: 'text.primary', font: 'inherit', fontWeight: 700, outline: 'none' }}
                              />
                              <IconButton size="small" onClick={() => setQty(l.product.id, l.quantity + 1)} aria-label="Sumar una unidad">
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <NumberField
                              money
                              value={l.price}
                              onValueChange={(v) => setPrice(l.product.id, v)}
                              inputProps={{ 'aria-label': `Precio unitario ${l.product.priceIncludesTax ? 'con' : 'antes de'} IVA de ${l.product.name}` }}
                              sx={{ maxWidth: 150 }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 800, ml: 'auto', whiteSpace: 'nowrap' }}>
                              {formatCurrency(l.total)}
                            </Typography>
                          </Box>
                          {over && (
                            <Typography variant="caption" color="error">
                              Solo hay {l.product.stock} u. disponibles
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                )}

                <Stack spacing={2}>
                  <Box>
                    <ToggleButtonGroup exclusive fullWidth size="small" value={form} onChange={(_, v) => v && setForm(v)} aria-label="Forma de pago">
                      <ToggleButton value="contado">Contado</ToggleButton>
                      <ToggleButton value="credito" disabled={isFinalConsumer}>
                        Crédito
                      </ToggleButton>
                    </ToggleButtonGroup>
                    {isFinalConsumer && (
                      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75, ml: 1 }}>
                        Para vender a crédito elige un cliente identificado.
                      </Typography>
                    )}
                  </Box>
                  {form === 'contado' ? (
                    <TextField select label="Medio de pago" value={payment} onChange={(e) => setPayment(e.target.value)}>
                      {settings.paymentMethods.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <NumberField label="Plazo" suffix="días" value={creditDays} onValueChange={setCreditDays} max={365} helperText={creditDays ? `Vence el ${formatDate(dueDate)}` : ' '} />
                  )}
                  <TextField label="Observaciones (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} inputProps={{ maxLength: 300 }} />

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal
                      </Typography>
                      <Typography variant="body2">{formatCurrency(calc.subtotal)}</Typography>
                    </Box>
                    {calc.taxes.map(([rate, t]) => (
                      <Box key={rate} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {rate ? `IVA ${rate} %` : 'Excluido de IVA'}
                        </Typography>
                        <Typography variant="body2">{formatCurrency(t.amount)}</Typography>
                      </Box>
                    ))}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1.5 }}>
                      <Typography variant="h5" component="p">
                        Total
                      </Typography>
                      <Typography component="p" sx={{ ...wide, fontSize: '2rem' }}>
                        {formatCurrency(calc.total)}
                      </Typography>
                    </Box>
                  </Box>
                  {error && <Alert severity="error">{error}</Alert>}
                  <Button variant="contained" color="charge" size="large" onClick={submit} disabled={submitting}>
                    {submitting ? 'Registrando…' : 'Registrar venta y facturar'}
                  </Button>
                </Stack>
              </Surface>
            </Box>
          </Box>
        )}
      </LoadGate>
      <ClientForm open={clientFormOpen} onClose={() => setClientFormOpen(false)} onSubmit={createClient} />
    </>
  );
};

export default NewSale;
