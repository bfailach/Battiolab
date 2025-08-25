import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Link, Alert, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const StyledBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(4),
  backgroundColor: '#F8B55F',
  borderRadius: theme.shape.borderRadius,
  width: '100%',
  maxWidth: 400,
}));

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'white',
    borderRadius: 3,
    fontWeight: 700,
    '& fieldset': {
      borderColor: '#E0E0E0',
    },
    '&:hover fieldset': {
      borderColor: '#7C4585',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#7C4585',
    },
    '& input': {
      fontWeight: 700,
      color: '#BCBCBC',
    },
    '& input::placeholder': {
      fontWeight: 700,
      opacity: 1,
      color: '#BCBCBC',
    },
  },
});

const StyledButton = styled(Button)({
  backgroundColor: '#7C4585',
  color: 'white',
  width: '100%',
  padding: '12px',
  marginTop: '16px',
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 700,
  borderRadius: 3,
  '&:hover': {
    backgroundColor: '#663366',
  },
});

const StyledLink = styled(Link)({
  fontWeight: 700,
  fontSize: '14px',
  color: '#7C4585',
  textDecorationColor: '#7C4585',
  '&:hover': {
    textDecorationColor: '#7C4585',
  },
});

const Login = () => {
  const navigate = useNavigate();
  const { login, error: contextError, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email || !password) {
      setFormError('Todos los campos son obligatorios');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('El correo electrónico no es válido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) return;

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      // El error se maneja en el contexto, pero podemos agregar lógica adicional aquí si es necesario
      console.error('Error durante el inicio de sesión:', err);
    }
  };

  // Determinar qué mensaje de error mostrar
  const errorMessage = formError || contextError;
  const showError = Boolean(errorMessage);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3D365C',
        padding: 2,
      }}
    >
      <Typography 
        variant="h2" 
        sx={{ 
          color: 'white', 
          mb: 4, 
          fontWeight: 700,
          fontSize: '48px'
        }}
      >
        Battiolab
      </Typography>
      
      <StyledBox component="form" onSubmit={handleSubmit}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3,
            color: '#303030',
            fontWeight: 700,
            fontSize: '24px'
          }}
        >
          Inicio de sesión
        </Typography>

        {showError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              width: '100%',
              '& .MuiAlert-message': {
                width: '100%',
                textAlign: 'center'
              }
            }}
          >
            {errorMessage}
          </Alert>
        )}
        
        <StyledTextField
          fullWidth
          placeholder="Correo electrónico"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
          type="email"
          autoComplete="email"
          required
        />
        
        <StyledTextField
          fullWidth
          placeholder="Contraseña"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 1 }}
          disabled={loading}
          autoComplete="current-password"
          required
        />
        
        <Box 
          sx={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: 2,
          }}
        >
          <StyledLink href="#" underline="hover">
            Olvidé mi contraseña
          </StyledLink>
          <StyledLink href="/register" underline="hover">
            Registrarse
          </StyledLink>
        </Box>
        
        <StyledButton 
          type="submit" 
          variant="contained"
          disabled={loading}
          sx={{
            position: 'relative'
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'INICIAR SESIÓN'}
        </StyledButton>
      </StyledBox>
    </Box>
  );
};

export default Login; 