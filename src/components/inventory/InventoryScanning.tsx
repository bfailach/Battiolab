import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, InputAdornment, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { PageHeader, Surface } from '../shared/Page';
import ChargeMeter, { levelColor, stockLevel } from '../shared/ChargeMeter';
import ProductThumb from './ProductThumb';
import { MovementList } from './ProductDetails';
import productsService, { Product, StockMovement } from '../../services/products.service';
import { formatCurrency } from '../../utils/format';

type Mode = 'in' | 'out' | 'check';

interface ScanResult {
  product: Product;
  applied: number;
  at: number;
}

const modeCopy: Record<Mode, { label: string; help: string }> = {
  in: { label: 'Entrada', help: 'Cada lectura suma unidades al stock.' },
  out: { label: 'Salida', help: 'Cada lectura descuenta unidades (consumo de taller, garantías, bajas).' },
  check: { label: 'Consultar', help: 'Solo muestra el producto, sin cambiar el stock.' }
};

/**
 * Los lectores de código de barras escriben el código y envían Enter, como un teclado.
 * Por eso basta con un campo con foco permanente.
 */
const InventoryScanning: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('check');
  const [qty, setQty] = useState(1);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [session, setSession] = useState({ scans: 0, inUnits: 0, outUnits: 0 });

  const refreshMovements = () => productsService.getAllMovements(8).then(setMovements).catch(() => undefined);

  useEffect(() => {
    refreshMovements();
    inputRef.current?.focus();
  }, []);

  const scan = async () => {
    const sku = code.trim();
    if (!sku || busy) return;
    setBusy(true);
    setError(null);
    try {
      let product = await productsService.getBySku(sku);
      let applied = 0;
      if (mode !== 'check') {
        const delta = mode === 'in' ? qty : -qty;
        product = await productsService.moveStock(product.id, delta, 'Lectura de escáner');
        applied = delta;
        setSession((s) => ({
          scans: s.scans + 1,
          inUnits: s.inUnits + (delta > 0 ? delta : 0),
          outUnits: s.outUnits + (delta < 0 ? -delta : 0)
        }));
        refreshMovements();
      } else {
        setSession((s) => ({ ...s, scans: s.scans + 1 }));
      }
      setResult({ product, applied, at: Date.now() });
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    } finally {
      setCode('');
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const level = result ? stockLevel(result.product.stock, result.product.minStock) : 'ok';

  return (
    <>
      <PageHeader title="Escaneo" description="Lee el código de barras o escribe el SKU y presiona Enter." />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: 3, alignItems: 'start' }}>
        <Stack spacing={3}>
          <Surface>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <ToggleButtonGroup
                exclusive
                value={mode}
                onChange={(_, v) => {
                  if (v) setMode(v);
                  inputRef.current?.focus();
                }}
                aria-label="Modo de escaneo"
              >
                {(Object.keys(modeCopy) as Mode[]).map((m) => (
                  <ToggleButton key={m} value={m} sx={{ px: 2.5 }}>
                    {modeCopy[m].label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              {mode !== 'check' && (
                <TextField
                  label="Unidades por lectura"
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                  InputProps={{ inputProps: { min: 1, step: 1 } }}
                  sx={{ maxWidth: 180 }}
                />
              )}
            </Stack>
            <TextField
              inputRef={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  scan();
                }
              }}
              placeholder="Esperando lectura…"
              size="medium"
              autoComplete="off"
              inputProps={{ 'aria-label': 'Código del producto', style: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '0.04em' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <QrCodeScannerIcon />
                  </InputAdornment>
                )
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {modeCopy[mode].help}
            </Typography>
          </Surface>

          {error && <Alert severity="error">{error}</Alert>}

          {result && (
            <Box
              key={result.at}
              aria-live="polite"
              sx={{
                p: 3,
                borderRadius: 3,
                border: '2px solid',
                borderColor: levelColor[level],
                bgcolor: alpha(levelColor[level], 0.12),
                display: 'flex',
                gap: 3,
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <ProductThumb imageUrl={result.product.imageUrl} category={result.product.category} size={96} radius={3} />
              <Box sx={{ flex: 1, minWidth: 220 }}>
                <Typography variant="body2" color="text.secondary">
                  {result.product.sku}, {result.product.category}
                </Typography>
                <Typography variant="h3" component="p">
                  {result.product.name}
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {formatCurrency(result.product.price)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                {result.applied !== 0 && (
                  <Typography variant="h4" component="p" sx={{ color: result.applied > 0 ? 'success.main' : 'error.main' }}>
                    {result.applied > 0 ? '+' : ''}
                    {result.applied} u.
                  </Typography>
                )}
                <Typography variant="h1" component="p">
                  {result.product.stock}
                </Typography>
                <ChargeMeter
                  value={result.product.stock / ((result.product.minStock || 5) * 3)}
                  level={level}
                  width={140}
                  height={16}
                />
                <Typography variant="caption" color="text.secondary" component="div">
                  unidades en stock
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>

        <Stack spacing={3}>
          <Surface title="Esta sesión">
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              {[
                ['Lecturas', session.scans],
                ['Entradas', session.inUnits],
                ['Salidas', session.outUnits]
              ].map(([label, value]) => (
                <Box key={label as string}>
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="h3" component="p">
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Surface>
          <Surface title="Últimos movimientos" subtitle="De todo el inventario">
            <MovementList movements={movements} showProduct />
          </Surface>
        </Stack>
      </Box>
    </>
  );
};

export default InventoryScanning;
