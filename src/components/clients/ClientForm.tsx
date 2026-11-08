import React, { useEffect, useState } from 'react';
import { FormControlLabel, Grid, Switch, TextField } from '@mui/material';
import FormDialog from '../shared/FormDialog';
import { Client, CreateClientData } from '../../services/clients.service';

const empty: CreateClientData = { name: '', document: '', email: '', phone: '', status: true };

const ClientForm: React.FC<{
  open: boolean;
  client?: Client | null;
  onClose: () => void;
  onSubmit: (data: CreateClientData) => Promise<void>;
}> = ({ open, client, onClose, onSubmit }) => {
  const [form, setForm] = useState<CreateClientData>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateClientData, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(client ? { name: client.name, document: client.document, email: client.email, phone: client.phone, status: client.status } : empty);
      setErrors({});
      setError(null);
    }
  }, [open, client]);

  const set = (k: keyof CreateClientData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Escribe el nombre';
    if (!form.document.trim()) next.document = 'Escribe el documento';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Escribe un correo válido';
    if (!form.phone.trim()) next.phone = 'Escribe el teléfono';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ ...form, name: form.name.trim(), document: form.document.trim(), email: form.email.trim(), phone: form.phone.trim() });
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
    >
      <TextField label="Nombre completo" value={form.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} autoFocus required />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Documento" value={form.document} onChange={set('document')} error={!!errors.document} helperText={errors.document} required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Teléfono" value={form.phone} onChange={set('phone')} error={!!errors.phone} helperText={errors.phone} required />
        </Grid>
      </Grid>
      <TextField label="Correo electrónico" type="email" value={form.email} onChange={set('email')} error={!!errors.email} helperText={errors.email} required />
      <FormControlLabel
        control={<Switch checked={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))} />}
        label={form.status ? 'Cliente activo' : 'Cliente inactivo'}
      />
    </FormDialog>
  );
};

export default ClientForm;
