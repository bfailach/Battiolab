import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, FormControlLabel, Grid, InputAdornment, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import { LoadGate, PageHeader, Surface } from '../shared/Page';
import ListEditor from '../shared/ListEditor';
import settingsService, { InventorySettings, SalesSettings as Sales } from '../../services/settings.service';
import { saleStatusLabel, SaleStatus } from '../../services/sales.service';
import { useLoad } from '../../hooks/useLoad';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

interface Draft {
  sales: Sales;
  inventory: InventorySettings;
}

const SalesSettings: React.FC = () => {
  const { notify } = useUI();
  const { isAdmin } = useAuth();
  const state = useLoad(async (): Promise<Draft> => {
    const [sales, inventory] = await Promise.all([settingsService.get('sales'), settingsService.get('inventory')]);
    return { sales, inventory };
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (state.data) setDraft(state.data);
  }, [state.data]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(state.data);
  const setSales = (patch: Partial<Sales>) => draft && setDraft({ ...draft, sales: { ...draft.sales, ...patch } });
  const setInv = (patch: Partial<InventorySettings>) => draft && setDraft({ ...draft, inventory: { ...draft.inventory, ...patch } });

  const save = async () => {
    if (!draft) return;
    if (draft.sales.taxRate < 0 || draft.sales.taxRate > 100) {
      notify('El impuesto debe estar entre 0 y 100 %', 'error');
      return;
    }
    setSaving(true);
    try {
      const [sales, inventory] = await Promise.all([settingsService.save('sales', draft.sales), settingsService.save('inventory', draft.inventory)]);
      state.setData({ sales, inventory });
      notify('Configuración guardada');
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const nextNumberExample = draft ? `${draft.sales.invoicePrefix}00042` : '';

  return (
    <>
      <PageHeader
        title="Configuración de ventas"
        description="Impuestos, numeración, formas de pago y las reglas de inventario que aplican al vender."
        actions={
          isAdmin && (
            <>
              <Button color="inherit" disabled={!dirty || saving} onClick={() => setDraft(state.data)}>
                Descartar
              </Button>
              <Button variant="contained" disabled={!dirty || saving} onClick={save}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </>
          )
        }
      />
      <LoadGate state={state}>
        {() =>
          draft && (
            <Stack spacing={3} sx={{ maxWidth: 820 }}>
              {!isAdmin && <Alert severity="info">Solo un administrador puede cambiar esta configuración.</Alert>}
              <Surface title="Facturación" subtitle="Se aplica a las ventas nuevas; las ya registradas no cambian.">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Impuesto"
                      type="number"
                      value={draft.sales.taxRate}
                      onChange={(e) => setSales({ taxRate: Number(e.target.value) })}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment>, inputProps: { min: 0, max: 100, step: 0.5 } }}
                      helperText="0 si los precios ya incluyen IVA"
                      disabled={!isAdmin}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Prefijo de numeración"
                      value={draft.sales.invoicePrefix}
                      onChange={(e) => setSales({ invoicePrefix: e.target.value })}
                      helperText={`Ejemplo: ${nextNumberExample}`}
                      disabled={!isAdmin}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      label="Estado por defecto"
                      value={draft.sales.defaultStatus}
                      onChange={(e) => setSales({ defaultStatus: e.target.value as SaleStatus })}
                      disabled={!isAdmin}
                    >
                      {(['completed', 'pending'] as SaleStatus[]).map((s) => (
                        <MenuItem key={s} value={s}>
                          {saleStatusLabel[s]}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Surface>
              <Surface title="Métodos de pago" subtitle="El primero de la lista aparece seleccionado en cada venta nueva.">
                <ListEditor
                  values={draft.sales.paymentMethods}
                  onChange={(paymentMethods) => setSales({ paymentMethods })}
                  placeholder="Nuevo método de pago"
                  disabled={!isAdmin}
                />
              </Surface>
              <Surface title="Inventario al vender">
                <FormControlLabel
                  control={<Switch checked={draft.sales.allowNegativeStock} onChange={(e) => setSales({ allowNegativeStock: e.target.checked })} disabled={!isAdmin} />}
                  label="Permitir vender sin stock disponible"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 6, mt: -0.5, mb: 2 }}>
                  Útil para preventas o encargos. El stock quedará en negativo hasta que llegue el lote.
                </Typography>
                <Box sx={{ maxWidth: 260 }}>
                  <TextField
                    label="Umbral general de alerta"
                    type="number"
                    value={draft.inventory.lowStockThreshold}
                    onChange={(e) => setInv({ lowStockThreshold: Math.max(0, Math.floor(Number(e.target.value))) })}
                    InputProps={{ endAdornment: <InputAdornment position="end">u.</InputAdornment>, inputProps: { min: 0 } }}
                    helperText="Para productos sin stock mínimo propio"
                    disabled={!isAdmin}
                  />
                </Box>
              </Surface>
              <Surface title="Categorías de producto">
                <ListEditor
                  values={draft.inventory.categories}
                  onChange={(categories) => setInv({ categories })}
                  placeholder="Nueva categoría"
                  disabled={!isAdmin}
                />
              </Surface>
            </Stack>
          )
        }
      </LoadGate>
    </>
  );
};

export default SalesSettings;
