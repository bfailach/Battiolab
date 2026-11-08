import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { LoadGate, PageHeader, Surface } from '../shared/Page';
import SearchField from '../shared/SearchField';
import { StockMeter } from '../shared/ChargeMeter';
import ProductThumb from '../inventory/ProductThumb';
import ClientForm from '../clients/ClientForm';
import clientsService, { Client, CreateClientData } from '../../services/clients.service';
import productsService, { Product } from '../../services/products.service';
import salesService, { Sale, SaleStatus, saleStatusLabel } from '../../services/sales.service';
import settingsService, { SalesSettings } from '../../services/settings.service';
import { useLoad } from '../../hooks/useLoad';
import { useUI } from '../../contexts/UIContext';
import { formatCurrency } from '../../utils/format';
import { printReceipt } from './receipt';
import { brand } from '../../theme';

interface Line {
  product: Product;
  quantity: number;
  price: number;
}

const defaults: SalesSettings = { taxRate: 0, invoicePrefix: '', defaultStatus: 'completed', paymentMethods: ['Efectivo'], allowNegativeStock: false };

const NewSale: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { notify } = useUI();
  const state = useLoad(async () => {
    const [clients, products, settings] = await Promise.all([
      clientsService.getAll(),
      productsService.getAll(),
      settingsService.get('sales').catch(() => defaults)
    ]);
    return { clients, products, settings };
  });

  const [client, setClient] = useState<Client | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState('');
  const [payment, setPayment] = useState('');
  const [status, setStatus] = useState<SaleStatus>('completed');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [done, setDone] = useState<Sale | null>(null);

  useEffect(() => {
    if (!state.data) return;
    const { settings, clients } = state.data;
    setStatus(settings.defaultStatus);
    setPayment((p) => p || settings.paymentMethods[0] || '');
    const pre = params.get('client');
    if (pre) setClient((c) => c || clients.find((x) => x.id === pre) || null);
  }, [state.data, params]);

  const settings = state.data?.settings || defaults;
  const allowNegative = settings.allowNegativeStock;

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (state.data?.products || [])
      .filter((p) => p.status !== 'discontinued')
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 12);
  }, [state.data, search]);

  const add = (product: Product) => {
    setError(null);
    setLines((ls) => {
      const existing = ls.find((l) => l.product.id === product.id);
      if (existing) return ls.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...ls, { product, quantity: 1, price: product.price }];
    });
  };
  const setQty = (id: string, q: number) => setLines((ls) => ls.map((l) => (l.product.id === id ? { ...l, quantity: Math.max(1, Math.floor(q) || 1) } : l)));
  const setPrice = (id: string, p: number) => setLines((ls) => ls.map((l) => (l.product.id === id ? { ...l, price: Math.max(0, p || 0) } : l)));
  const remove = (id: string) => setLines((ls) => ls.filter((l) => l.product.id !== id));

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const tax = Math.round(subtotal * settings.taxRate) / 100;
  const total = subtotal + tax;
  const short = status !== 'cancelled' && !allowNegative ? lines.filter((l) => l.quantity > l.product.stock) : [];

  const submit = async () => {
    if (!client) return setError('Elige el cliente de la venta');
    if (!lines.length) return setError('Agrega al menos un producto');
    if (short.length) return setError(`No hay stock suficiente de: ${short.map((l) => l.product.name).join(', ')}`);
    setSubmitting(true);
    setError(null);
    try {
      const sale = await salesService.create({
        client: { id: client.id },
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity, price: l.price })),
        status,
        paymentMethod: payment || undefined,
        notes: notes.trim() || undefined
      });
      setDone(sale);
      notify(`Venta ${sale.number || ''} registrada`);
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
      <Box sx={{ maxWidth: 560, mx: 'auto', mt: { md: 6 } }}>
        <Surface>
          <Stack spacing={2} alignItems="flex-start">
            <CheckCircleIcon sx={{ fontSize: 48, color: brand.ok }} />
            <Typography variant="h2" component="h1">
              Venta {done.number} registrada
            </Typography>
            <Typography color="text.secondary">
              {done.client.name}, {formatCurrency(done.total)}. {done.status === 'cancelled' ? 'No se descontó stock.' : 'El inventario ya se descontó.'}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ pt: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<PrintOutlinedIcon />} onClick={() => printReceipt(done)}>
                Imprimir comprobante
              </Button>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={reset}>
                Otra venta
              </Button>
              <Button color="inherit" onClick={() => navigate('/dashboard/sales/list')}>
                Ver todas las ventas
              </Button>
            </Stack>
          </Stack>
        </Surface>
      </Box>
    );
  }

  return (
    <>
      <PageHeader title="Nueva venta" description="Elige el cliente, agrega productos y confirma. El stock se descuenta al registrar." />
      <LoadGate state={state}>
        {(data) => (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 420px' }, gap: 3, alignItems: 'start' }}>
            <Stack spacing={3}>
              <Surface title="Cliente">
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Autocomplete<Client>
                    options={data.clients.filter((c) => c.status)}
                    value={client}
                    onChange={(_, c) => {
                      setClient(c);
                      setError(null);
                    }}
                    getOptionLabel={(c) => `${c.name} (${c.document})`}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    renderInput={(p) => <TextField {...p} label="Buscar cliente" placeholder="Nombre o documento" />}
                    noOptionsText="Ningún cliente activo coincide"
                    sx={{ flex: 1 }}
                  />
                  <Button variant="outlined" startIcon={<PersonAddAlt1OutlinedIcon />} onClick={() => setClientFormOpen(true)} sx={{ flexShrink: 0 }}>
                    Cliente nuevo
                  </Button>
                </Stack>
              </Surface>

              <Surface title="Productos" action={<SearchField value={search} onChange={setSearch} placeholder="Buscar producto o SKU" maxWidth={260} />}>
                {results.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Ningún producto coincide con la búsqueda.
                  </Typography>
                ) : (
                  <Stack divider={<Divider />}>
                    {results.map((p) => {
                      const inCart = lines.find((l) => l.product.id === p.id)?.quantity || 0;
                      const out = !allowNegative && p.stock - inCart <= 0;
                      return (
                        <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.25 }}>
                          <ProductThumb imageUrl={p.imageUrl} category={p.category} size={44} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                              {p.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {p.sku}, {formatCurrency(p.price)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <StockMeter stock={p.stock} minStock={p.minStock} width={64} />
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

            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 84 } }}>
              <Surface title="Resumen" subtitle={client ? client.name : 'Sin cliente seleccionado'}>
                {lines.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <ShoppingCartOutlinedIcon />
                    <Typography variant="body2">Agrega productos desde la lista.</Typography>
                  </Box>
                ) : (
                  <Stack divider={<Divider />} sx={{ mb: 2 }}>
                    {lines.map((l) => {
                      const over = !allowNegative && status !== 'cancelled' && l.quantity > l.product.stock;
                      return (
                        <Box key={l.product.id} sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                              {l.product.name}
                            </Typography>
                            <IconButton size="small" onClick={() => remove(l.product.id)} aria-label={`Quitar ${l.product.name}`}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: over ? 'error.main' : 'divider', borderRadius: 2 }}>
                              <IconButton size="small" onClick={() => setQty(l.product.id, l.quantity - 1)} aria-label="Restar una unidad" disabled={l.quantity <= 1}>
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Box
                                component="input"
                                type="number"
                                value={l.quantity}
                                aria-label={`Cantidad de ${l.product.name}`}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQty(l.product.id, Number(e.target.value))}
                                sx={{ width: 40, textAlign: 'center', border: 0, bgcolor: 'transparent', color: 'text.primary', font: 'inherit', fontWeight: 600, MozAppearance: 'textfield', '&::-webkit-inner-spin-button': { display: 'none' } }}
                              />
                              <IconButton size="small" onClick={() => setQty(l.product.id, l.quantity + 1)} aria-label="Sumar una unidad">
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <TextField
                              type="number"
                              value={l.price}
                              onChange={(e) => setPrice(l.product.id, Number(e.target.value))}
                              inputProps={{ 'aria-label': `Precio de ${l.product.name}`, min: 0 }}
                              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                              sx={{ maxWidth: 150 }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600, ml: 'auto', whiteSpace: 'nowrap' }}>
                              {formatCurrency(l.price * l.quantity)}
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
                  <Stack direction="row" spacing={1.5}>
                    <TextField select label="Método de pago" value={payment} onChange={(e) => setPayment(e.target.value)}>
                      {settings.paymentMethods.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField select label="Estado" value={status} onChange={(e) => setStatus(e.target.value as SaleStatus)}>
                      {(['completed', 'pending'] as SaleStatus[]).map((s) => (
                        <MenuItem key={s} value={s}>
                          {saleStatusLabel[s]}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                  <TextField label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} />

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                      <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
                    </Box>
                    {settings.taxRate > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Impuesto ({settings.taxRate} %)</Typography>
                        <Typography variant="body2">{formatCurrency(tax)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1 }}>
                      <Typography variant="h4" component="p">Total</Typography>
                      <Typography variant="h2" component="p">{formatCurrency(total)}</Typography>
                    </Box>
                  </Box>
                  {error && <Alert severity="error">{error}</Alert>}
                  <Button variant="contained" color="secondary" size="large" onClick={submit} disabled={submitting} sx={{ minHeight: 48 }}>
                    {submitting ? 'Registrando…' : 'Registrar venta'}
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
