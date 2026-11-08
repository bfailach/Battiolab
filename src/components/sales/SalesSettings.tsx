import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, FormControlLabel, Link, Stack, Switch, TextField, Typography } from '@mui/material';
import { LoadGate, PageHeader, Surface } from '../shared/Page';
import { FormGrid } from '../shared/FormDialog';
import { NumberField } from '../shared/Fields';
import ListEditor from '../shared/ListEditor';
import settingsService, { InventorySettings, SalesSettings as Sales } from '../../services/settings.service';
import { useLoad } from '../../hooks/useLoad';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

interface Draft {
  sales: Sales;
  inventory: InventorySettings;
}

const SalesSettings: React.FC = () => {
  const navigate = useNavigate();
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
    if (!draft.sales.paymentMethods.length) return notify('Deja al menos un medio de pago', 'error');
    if (!draft.inventory.categories.length) return notify('Deja al menos una categoría de producto', 'error');
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

  return (
    <>
      <PageHeader
        title="Configuración de ventas"
        description="Numeración interna, crédito, medios de pago y reglas de inventario al vender."
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
            <Stack spacing={3} sx={{ maxWidth: 860 }}>
              {!isAdmin && <Alert severity="info">Solo un administrador puede cambiar esta configuración.</Alert>}
              <Alert severity="info">
                El IVA se configura en cada producto. La resolución de facturación DIAN y los datos del emisor están en{' '}
                <Link component="button" onClick={() => navigate('/dashboard/company')} sx={{ verticalAlign: 'baseline' }}>
                  Empresa
                </Link>
                .
              </Alert>
              <Surface title="Numeración y crédito" subtitle="El prefijo interno solo se usa mientras no haya una resolución DIAN registrada.">
                <FormGrid columns={3}>
                  <TextField
                    label="Prefijo interno"
                    value={draft.sales.invoicePrefix}
                    onChange={(e) => setSales({ invoicePrefix: e.target.value.toUpperCase().slice(0, 6) })}
                    helperText={`Ejemplo: ${draft.sales.invoicePrefix}00042`}
                    disabled={!isAdmin}
                  />
                  <TextField
                    label="Prefijo de notas crédito"
                    value={draft.sales.creditNotePrefix}
                    onChange={(e) => setSales({ creditNotePrefix: e.target.value.toUpperCase().slice(0, 6) })}
                    helperText={`Ejemplo: ${draft.sales.creditNotePrefix}00003`}
                    disabled={!isAdmin}
                  />
                  <NumberField
                    label="Plazo de crédito por defecto"
                    suffix="días"
                    value={draft.sales.defaultCreditDays}
                    onValueChange={(v) => setSales({ defaultCreditDays: v || 0 })}
                    max={365}
                    helperText=" "
                    disabled={!isAdmin}
                  />
                </FormGrid>
              </Surface>
              <Surface title="Medios de pago" subtitle="El primero de la lista aparece seleccionado en cada venta de contado.">
                <ListEditor values={draft.sales.paymentMethods} onChange={(paymentMethods) => setSales({ paymentMethods })} placeholder="Nuevo medio de pago" disabled={!isAdmin} />
              </Surface>
              <Surface title="Inventario al vender">
                <FormControlLabel
                  control={<Switch checked={draft.sales.allowNegativeStock} onChange={(e) => setSales({ allowNegativeStock: e.target.checked })} disabled={!isAdmin} />}
                  label="Permitir vender sin stock disponible"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 6, mt: -0.5, mb: 3 }}>
                  Útil para preventas o encargos. El stock quedará en negativo hasta que llegue el lote.
                </Typography>
                <Box sx={{ maxWidth: 280 }}>
                  <NumberField
                    label="Umbral general de alerta"
                    suffix="u."
                    value={draft.inventory.lowStockThreshold}
                    onValueChange={(v) => setInv({ lowStockThreshold: v || 0 })}
                    max={9999}
                    helperText="Para productos sin stock mínimo propio"
                    disabled={!isAdmin}
                  />
                </Box>
              </Surface>
              <Surface title="Categorías de producto">
                <ListEditor values={draft.inventory.categories} onChange={(categories) => setInv({ categories })} placeholder="Nueva categoría" disabled={!isAdmin} />
              </Surface>
            </Stack>
          )
        }
      </LoadGate>
    </>
  );
};

export default SalesSettings;
