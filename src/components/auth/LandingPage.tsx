import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const StyledButton = styled(Button)({
  width: '200px',
  padding: '12px',
  borderRadius: '5px',
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 700,
  margin: '0 10px',
});

const PrimaryButton = styled(StyledButton)({
  backgroundColor: '#C95792',
  color: '#303030',
  '&:hover': {
    backgroundColor: '#B94B82',
  },
});

const SecondaryButton = styled(StyledButton)({
  backgroundColor: '#F8B55F',
  color: '#303030',
  '&:hover': {
    backgroundColor: '#E5A54F',
  },
});

const LandingPage = () => {
  const navigate = useNavigate();

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
        variant="h1"
        sx={{
          color: 'white',
          fontSize: '72px',
          fontWeight: 700,
          marginBottom: 6,
          fontFamily: 'Niramit Bold, sans-serif',
        }}
      >
        Battiolab
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
        }}
      >
        <PrimaryButton onClick={() => navigate('/register')}>
          Registrarse
        </PrimaryButton>
        <SecondaryButton onClick={() => navigate('/login')}>
          Iniciar sesión
        </SecondaryButton>
      </Box>
    </Box>
  );
};

export default LandingPage; 