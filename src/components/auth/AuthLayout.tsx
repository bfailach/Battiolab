import React from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import Logo from '../shared/Logo';
import { brand, wide } from '../../theme';

const fill = keyframes`
  from { opacity: 0.1; transform: scaleY(0.6); }
  to { opacity: 1; transform: scaleY(1); }
`;

/** La única animación de entrada: la celda se carga segmento a segmento. */
const ChargingCell: React.FC = () => (
  <Box aria-hidden sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)',
        gap: '7px',
        p: '9px',
        width: { md: 420, lg: 520 },
        height: 104,
        border: '3px solid #FFFFFF',
        borderRadius: '18px'
      }}
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            borderRadius: '6px',
            bgcolor: i < 8 ? brand.charge : i === 8 ? brand.magenta : 'rgba(255,255,255,0.1)',
            transformOrigin: 'bottom',
            animation: i < 9 ? `${fill} 360ms cubic-bezier(.2,.8,.2,1) ${i * 90}ms both` : 'none'
          }}
        />
      ))}
    </Box>
    <Box sx={{ width: 12, height: 40, bgcolor: '#FFFFFF', borderRadius: '0 6px 6px 0' }} />
  </Box>
);

const AuthLayout: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: '#fff', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' } }}>
    <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', p: { md: 6, lg: 8 } }}>
      <Logo size={30} />
      <Box>
        <Typography
          component="p"
          sx={{ ...wide, fontStretch: '125%', fontWeight: 900, fontSize: { md: '3.5rem', lg: '5rem' }, lineHeight: 0.95, letterSpacing: '-0.03em', maxWidth: 760 }}
        >
          Carga completa para el taller y la tienda.
        </Typography>
        <Typography sx={{ mt: 3, mb: 6, color: '#A3A3AA', maxWidth: 460, fontSize: '1.0625rem' }}>
          Ventas con factura, inventario de vehículos y repuestos, clientes y equipo de Battiolab.
        </Typography>
        <ChargingCell />
      </Box>
      <Typography variant="caption" sx={{ color: '#6F6F76' }}>
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
