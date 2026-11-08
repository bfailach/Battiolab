import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, IconButton, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Ingresa tu correo y contraseña');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Inicia sesión" subtitle="Usa la cuenta que te asignaron en tu sede.">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            autoFocus
            size="medium"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            size="medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ minHeight: 46 }}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          ¿Aún no tienes cuenta?{' '}
          <Link component={RouterLink} to="/register" fontWeight={600}>
            Crear una cuenta
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
};

export default Login;
