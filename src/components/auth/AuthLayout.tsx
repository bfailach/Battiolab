import React from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import Logo from '../shared/Logo';
import { brand, wide } from '../../theme';

const fill = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const spark = keyframes`
  from { opacity: 0; transform: scaleY(0.6); }
  to { opacity: 1; transform: scaleY(1); }
`;

/** La única animación de entrada: la celda del logo se carga y al final aparece la chispa ámbar. */
const ChargingCell: React.FC = () => (
  <Box
    aria-hidden
    sx={{
      display: 'grid',
      gridTemplateColumns: '10.6fr 4.1fr',
      gap: '14px',
      p: '14px',
      width: { md: 420, lg: 520 },
      height: 120,
      border: '4px solid #FFFFFF',
      borderRadius: '26px',
      boxSizing: 'border-box'
    }}
  >
    <Box sx={{ borderRadius: '9px', bgcolor: brand.primarySoft, transformOrigin: 'left', animation: `${fill} 700ms cubic-bezier(.2,.8,.2,1) both` }} />
    <Box sx={{ borderRadius: '8px', bgcolor: brand.charge, transformOrigin: 'bottom', animation: `${spark} 320ms cubic-bezier(.2,.8,.2,1) 650ms both` }} />
  </Box>
);

const AuthLayout: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' } }}>
    <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', p: { md: 6, lg: 8 }, bgcolor: brand.ink, color: '#FFFFFF' }}>
      <Logo size={30} />
      <Box>
        <Typography
          component="p"
          sx={{ ...wide, fontStretch: '125%', fontWeight: 900, fontSize: { md: '3.5rem', lg: '5rem' }, lineHeight: 0.95, letterSpacing: '-0.03em', maxWidth: 760 }}
        >
          Carga completa para el taller y la tienda.
        </Typography>
        <Typography sx={{ mt: 3, mb: 6, color: '#C7C5E0', maxWidth: 460, fontSize: '1.0625rem' }}>
          Ventas con factura, inventario de vehículos y repuestos, clientes y equipo de Battiolab.
        </Typography>
        <ChargingCell />
      </Box>
      <Typography variant="caption" sx={{ color: '#A5B4FC' }}>
        Battiolab ERP 1.2
      </Typography>
    </Box>

    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 } }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: 440,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderRadius: 7,
          border: '1px solid',
          borderColor: 'divider',
          p: { xs: 3, sm: 5 }
        }}
      >
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
          <Logo size={24} color="currentColor" />
        </Box>
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
          {subtitle}
        </Typography>
        {children}
      </Box>
    </Box>
  </Box>
);

export default AuthLayout;
