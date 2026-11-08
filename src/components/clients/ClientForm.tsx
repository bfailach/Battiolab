import React, { useEffect, useState } from 'react';
import { FormControlLabel, Switch, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import FormDialog, { FormGrid, Full } from '../shared/FormDialog';
import { DocumentFields, PhoneField } from '../shared/Fields';
import { Client, CreateClientData } from '../../services/clients.service';
import { DocumentType, validateDocument, validateEmail, validateName, validatePhone } from '../../utils/validation';

const empty: CreateClientData = { personType: 'natural', name: '', documentType: 'CC', document: '', email: '', phone: '', address: '', city: '', status: true };

type Errors = Partial<Record<'name' | 'document' | 'email' | 'phone', string | null>>;

const ClientForm: React.FC<{
  open: boolean;
  client?: Client | null;
  onClose: () => void;
  onSubmit: (data: CreateClientData) => Promise<void>;
}> = ({ open, client, onClose, onSubmit }) => {
  const [form, setForm] = useState<CreateClientData>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      client
        ? {
            personType: client.personType,
            name: client.name,
            documentType: client.documentType,
            document: client.document,
            email: client.email || '',
            phone: client.phone,
            address: client.address || '',
            city: client.city || '',
            status: client.status
          }
        : empty
    );
    setErrors({});
    setError(null);
  }, [open, client]);

  const company = form.personType === 'juridica';
  const set = <K extends keyof CreateClientData>(k: K, v: CreateClientData[K]) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const next: Errors = {
      name: validateName(form.name),
      document: validateDocument(form.documentType, form.document),
      email: validateEmail(form.email || ''),
      phone: validatePhone(form.phone)
    };
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ ...form, name: form.name.trim().replace(/\s+/g, ' '), email: form.email?.trim() || undefined });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title={client ? 'Editar cliente' : 'Nuevo cliente'}
      submitLabel={client ? 'Guardar cambios' : 'Crear cliente'}
      onClose={onClose}
      onSubmit={submit}
      submitting={submitting}
      error={error}
      description="Estos datos aparecen como adquirente en las facturas."
    >
      <FormGrid>
        <Full>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={form.personType}
            onChange={(_, v) => {
              if (!v) return;
              setForm((f) => ({
                ...f,
                personType: v,
                documentType: v === 'juridica' ? 'NIT' : f.documentType === 'NIT' ? 'CC' : f.documentType,
                document: ''
              }));
            }}
            aria-label="Tipo de cliente"
          >
            <ToggleButton value="natural">Persona natural</ToggleButton>
            <ToggleButton value="juridica">Empresa</ToggleButton>
          </ToggleButtonGroup>
        </Full>
        <Full>
          <TextField
            label={company ? 'Razón social' : 'Nombre completo'}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name || ' '}
            autoFocus
            required
            inputProps={{ maxLength: 120 }}
          />
        </Full>
        <DocumentFields
          type={form.documentType}
          value={form.document}
          onTypeChange={(t: DocumentType) => set('documentType', t)}
          onValueChange={(v) => set('document', v)}
          error={errors.document}
          types={company ? ['NIT'] : ['CC', 'CE', 'TI', 'PP', 'PPT']}
        />
        <PhoneField value={form.phone} onValueChange={(v) => set('phone', v)} error={!!errors.phone} helperText={errors.phone || 'Celular o fijo con indicativo'} required />
        <TextField
          label="Correo electrónico"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          error={!!errors.email}
          helperText={errors.email || 'Opcional. Para enviarle la factura'}
        />
        <TextField label="Dirección" value={form.address} onChange={(e) => set('address', e.target.value)} helperText=" " inputProps={{ maxLength: 120 }} />
        <TextField label="Ciudad" value={form.city} onChange={(e) => set('city', e.target.value)} helperText=" " inputProps={{ maxLength: 60 }} />
        {client && (
          <Full>
            <FormControlLabel
              control={<Switch checked={form.status} onChange={(e) => set('status', e.target.checked)} />}
              label={form.status ? 'Cliente activo' : 'Cliente inactivo: no aparece al crear ventas'}
            />
          </Full>
        )}
      </FormGrid>
    </FormDialog>
  );
};

export default ClientForm;
