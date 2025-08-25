import React, { useState } from 'react';
import { TextField, Button, Typography, Box, Alert, CircularProgress } from '@mui/material';
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
  width: '45%',
  padding: '12px',
  marginTop: '16px',
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 700,
  borderRadius: 3,
  '&:hover': {
    backgroundColor: '#663366',
  },
  '&.secondary': {
    backgroundColor: '#C95792',
    '&:hover': {
      backgroundColor: '#B94B82',
    },
  }
});

const Register = () => {
  const navigate = useNavigate();
  const { register, error, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [siteCode, setSiteCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !siteCode) {
      setFormError('Todos los campos son obligatorios');
      return false;
    }
    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden');
      return false;
    }
    if (password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres');
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

    console.log('Sending registration data:', { email, password, siteCode });

    try {
      await register(email, password, siteCode);
      navigate('/login');
    } catch (err: any) {
      console.error('Registration error:', err);
      // El error se maneja en el contexto, pero lo mostramos también aquí para debugging
      setFormError(err.message || 'Error al registrarse');
    }
  };

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
      
      <StyledBox>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3,
            color: '#303030',
            fontWeight: 700,
            fontSize: '24px'
          }}
        >
          Registro
        </Typography>

        {(error || formError) && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error || formError}
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
        />
        
        <StyledTextField
          fullWidth
          placeholder="Contraseña"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
        />
        
        <StyledTextField
          fullWidth
          placeholder="Confirmar contraseña"
          type="password"
          variant="outlined"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
        />
        
        <StyledTextField
          fullWidth
          placeholder="Código sede Battiolab"
          variant="outlined"
          value={siteCode}
          onChange={(e) => setSiteCode(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
        />
        
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
          <StyledButton
            variant="contained"
            className="secondary"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            VOLVER
          </StyledButton>
          <StyledButton 
            type="submit" 
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'REGISTRARSE'}
          </StyledButton>
        </Box>
      </StyledBox>
    </Box>
  );
};

export default Register;
