import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { LoadGate, PageHeader, Surface } from '../shared/Page';
import { FormGrid, Full } from '../shared/FormDialog';
import { NumberField, PhoneField } from '../shared/Fields';
import StatusChip from '../shared/StatusChip';
import settingsService, { CompanySettings as Company, taxRegimeLabel } from '../../services/settings.service';
import salesService from '../../services/sales.service';
import ChargeMeter from '../shared/ChargeMeter';
import { useLoad } from '../../hooks/useLoad';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { nitCheckDigit, validateEmail, validatePhone } from '../../utils/validation';

const CompanySettings: React.FC = () => {
  const { notify } = useUI();
  const { isAdmin } = useAuth();
  const state = useLoad(async () => {
    const [company, sales] = await Promise.all([settingsService.get('company'), salesService.getAll().catch(() => [])]);
    return { company, sales };
  });
  const [draft, setDraft] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (state.data) setDraft(state.data.company);
  }, [state.data]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(state.data?.company);
  const set = <K extends keyof Company>(k: K, v: Company[K]) => draft && setDraft({ ...draft, [k]: v });
  const ro = !isAdmin;

  const save = async () => {
    if (!draft) return;
    const next = {
      nit: draft.nit && draft.nit.length !== 9 ? 'El NIT tiene 9 dígitos, sin el de verificación' : null,
      phone: draft.phone ? validatePhone(draft.phone) : null,
      email: validateEmail(draft.email),
      range: draft.resolutionTo && draft.resolutionFrom > draft.resolutionTo ? '"Desde" no puede ser mayor que "hasta"' : null
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSaving(true);
    try {
      const saved = await settingsService.save('company', draft);
      state.setData((d) => (d ? { ...d, company: saved } : d));
      notify('Datos de la empresa guardados');
    } catch (e) {
      notify((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const resolution = (() => {
    if (!draft || !state.data) return null;
    if (!draft.resolutionNumber || !draft.resolutionTo) return { label: 'Sin resolución', tone: 'warn' as const, used: 0, total: 0 };
    const seqs = state.data.sales
      .map((s) => s.number || '')
      .filter((n) => n.startsWith(draft.resolutionPrefix || ''))
      .map((n) => Number(n.slice((draft.resolutionPrefix || '').length)))
      .filter((n) => Number.isFinite(n) && n >= draft.resolutionFrom && n <= draft.resolutionTo);
    const last = seqs.length ? Math.max(...seqs) : draft.resolutionFrom - 1;
    const total = draft.resolutionTo - draft.resolutionFrom + 1;
    const used = Math.max(0, last - draft.resolutionFrom + 1);
    const expired = draft.resolutionValidUntil && new Date(`${draft.resolutionValidUntil}T23:59:59`) < new Date();
    const soon = draft.resolutionValidUntil && new Date(`${draft.resolutionValidUntil}T23:59:59`).getTime() - Date.now() < 60 * 86400000;
    return {
      label: expired ? 'Vencida' : used >= total ? 'Rango agotado' : soon || total - used < 50 ? 'Por renovar' : 'Vigente',
      tone: (expired || used >= total ? 'bad' : soon || total - used < 50 ? 'warn' : 'ok') as 'bad' | 'warn' | 'ok',
      used,
      total,
      next: last + 1
    };
  })();

  return (
    <>
      <PageHeader
        title="Empresa"
        description="Datos del emisor y de la resolución de facturación que aparecen en cada factura."
        actions={
          isAdmin && (
            <>
              <Button color="inherit" disabled={!dirty || saving} onClick={() => setDraft(state.data?.company || null)}>
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
            <Stack spacing={3} sx={{ maxWidth: 920 }}>
              {!isAdmin && <Alert severity="info">Solo un administrador puede cambiar los datos de la empresa.</Alert>}
              <Surface title="Emisor" subtitle="Requisitos del art. 617 del Estatuto Tributario: razón social, NIT y calidad tributaria.">
                <FormGrid>
                  <TextField label="Razón social" value={draft.legalName} onChange={(e) => set('legalName', e.target.value)} disabled={ro} helperText="Como aparece en el RUT" />
                  <TextField label="Nombre comercial" value={draft.tradeName} onChange={(e) => set('tradeName', e.target.value)} disabled={ro} helperText=" " />
                  <TextField
                    label="NIT"
                    value={draft.nit}
                    onChange={(e) => set('nit', e.target.value.replace(/\D/g, '').slice(0, 9))}
                    disabled={ro}
                    error={!!errors.nit}
                    helperText={errors.nit || 'Sin el dígito de verificación'}
                    inputProps={{ inputMode: 'numeric' }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            DV {draft.nit.length === 9 ? nitCheckDigit(draft.nit) : '–'}
                          </Typography>
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField select label="Responsabilidad frente al IVA" value={draft.taxRegime} onChange={(e) => set('taxRegime', e.target.value as Company['taxRegime'])} disabled={ro} helperText=" ">
                    {Object.entries(taxRegimeLabel).map(([k, v]) => (
                      <MenuItem key={k} value={k}>
                        {v}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Full>
                    <TextField
                      label="Calidad tributaria"
                      value={draft.taxNotes}
                      onChange={(e) => set('taxNotes', e.target.value)}
                      disabled={ro}
                      helperText="Por ejemplo: No somos grandes contribuyentes. No somos autorretenedores de renta. Agente de retención de IVA."
                    />
                  </Full>
                  <TextField label="Dirección" value={draft.address} onChange={(e) => set('address', e.target.value)} disabled={ro} helperText=" " />
                  <TextField label="Ciudad" value={draft.city} onChange={(e) => set('city', e.target.value)} disabled={ro} helperText=" " />
                  <PhoneField value={draft.phone} onValueChange={(v) => set('phone', v)} disabled={ro} error={!!errors.phone} helperText={errors.phone || ' '} />
                  <TextField label="Correo de facturación" value={draft.email} onChange={(e) => set('email', e.target.value)} disabled={ro} error={!!errors.email} helperText={errors.email || ' '} />
                  <TextField label="Sitio web" value={draft.website} onChange={(e) => set('website', e.target.value)} disabled={ro} helperText=" " />
                </FormGrid>
              </Surface>

              <Surface
                title="Resolución de facturación DIAN"
                subtitle="Prefijo, consecutivo, fecha y vigencia de la autorización de numeración (art. 11, num. 4, Res. 000165 de 2023)."
                action={resolution && <StatusChip label={resolution.label} tone={resolution.tone} />}
              >
                <FormGrid columns={3}>
                  <TextField label="Número de resolución" value={draft.resolutionNumber} onChange={(e) => set('resolutionNumber', e.target.value.replace(/\D/g, ''))} disabled={ro} helperText=" " />
                  <TextField label="Fecha de la resolución" type="date" value={draft.resolutionDate} onChange={(e) => set('resolutionDate', e.target.value)} InputLabelProps={{ shrink: true }} disabled={ro} helperText=" " />
                  <TextField label="Vigente hasta" type="date" value={draft.resolutionValidUntil} onChange={(e) => set('resolutionValidUntil', e.target.value)} InputLabelProps={{ shrink: true }} disabled={ro} helperText=" " />
                  <TextField
                    label="Prefijo"
                    value={draft.resolutionPrefix}
                    onChange={(e) => set('resolutionPrefix', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                    disabled={ro}
                    helperText="Hasta 4 caracteres"
                  />
                  <NumberField label="Desde" value={draft.resolutionFrom || null} onValueChange={(v) => set('resolutionFrom', v || 0)} disabled={ro} error={!!errors.range} helperText={errors.range || ' '} />
                  <NumberField label="Hasta" value={draft.resolutionTo || null} onValueChange={(v) => set('resolutionTo', v || 0)} disabled={ro} helperText=" " />
                </FormGrid>
                {resolution && resolution.total > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <ChargeMeter
                      value={resolution.used / resolution.total}
                      level={resolution.tone === 'ok' ? 'ok' : resolution.tone === 'warn' ? 'low' : 'empty'}
                      width={260}
                      segments={20}
                      height={14}
                      label={`${resolution.used} de ${resolution.total} números usados. Próxima: ${draft.resolutionPrefix}${resolution.next}${draft.resolutionValidUntil ? `. Vence el ${formatDate(draft.resolutionValidUntil)}` : ''}`}
                    />
                  </Box>
                )}
                <Alert severity="info" sx={{ mt: 2.5 }}>
                  Battiolab genera la representación gráfica y la numeración. Para que la factura electrónica tenga validez, debe transmitirse a la DIAN por medio de un proveedor
                  tecnológico, que asigna el CUFE, la firma digital y el código QR.
                </Alert>
              </Surface>

              <Surface title="Pie de factura" subtitle="Texto adicional al final de cada factura: garantías, políticas de cambio o cuentas bancarias.">
                <TextField value={draft.invoiceFooter} onChange={(e) => set('invoiceFooter', e.target.value)} multiline minRows={3} disabled={ro} inputProps={{ maxLength: 600, 'aria-label': 'Pie de factura' }} />
              </Surface>

              <Surface title="Valores de referencia" subtitle="Se usan en avisos de IVA y de nómina. Actualízalos cada año.">
                <FormGrid>
                  <NumberField label="UVT" money value={draft.uvt} onValueChange={(v) => set('uvt', v || 0)} disabled={ro} helperText={`2026: ${formatCurrency(52374)} (Res. DIAN 000238 de 2025)`} />
                  <NumberField label="Salario mínimo mensual" money value={draft.minimumWage} onValueChange={(v) => set('minimumWage', v || 0)} disabled={ro} helperText={`2026: ${formatCurrency(1750905)}`} />
                </FormGrid>
              </Surface>
            </Stack>
          )
        }
      </LoadGate>
    </>
  );
};

export default CompanySettings;
