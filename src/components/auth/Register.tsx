import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../contexts/AuthContext';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', siteCode: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const mismatch = form.confirm.length > 0 && form.password !== form.confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.siteCode) {
      setError('Completa correo, contraseña y código de sede');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register({ name: form.name || undefined, email: form.email, password: form.password, siteCode: form.siteCode });
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Necesitas el código de tu sede. Pídeselo a quien administra Battiolab.">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Nombre" autoComplete="name" size="medium" value={form.name} onChange={set('name')} autoFocus />
          <TextField label="Correo electrónico" type="email" autoComplete="email" size="medium" value={form.email} onChange={set('email')} required />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            size="medium"
            value={form.password}
            onChange={set('password')}
            helperText="Mínimo 6 caracteres"
            required
          />
          <TextField
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            size="medium"
            value={form.confirm}
            onChange={set('confirm')}
            error={mismatch}
            helperText={mismatch ? 'No coincide con la contraseña' : ' '}
            required
          />
          <TextField label="Código de sede" size="medium" value={form.siteCode} onChange={set('siteCode')} required />
          <Button type="submit" variant="contained" color="charge" size="large" disabled={submitting}>
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          ¿Ya tienes cuenta?{' '}
          <Link component={RouterLink} to="/login" fontWeight={600}>
            Inicia sesión
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
};

export default Register;
