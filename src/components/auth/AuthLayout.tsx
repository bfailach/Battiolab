import React from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import Logo from '../shared/Logo';
import { brand, headingFont } from '../../theme';

const fill = keyframes`
  from { opacity: 0.12; }
  to { opacity: 1; }
`;

/** La única animación de carga: la celda se "carga" segmento a segmento al abrir la app. */
const ChargingCell: React.FC = () => (
  <Box aria-hidden sx={{ display: 'flex', alignItems: 'center', gap: '6px', mt: 6 }}>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '6px',
        p: '8px',
        width: { md: 340, lg: 400 },
        height: 92,
        border: '3px solid rgba(255,255,255,0.85)',
        borderRadius: '14px'
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            borderRadius: '5px',
            bgcolor: i < 6 ? brand.charge : i === 6 ? brand.magenta : 'rgba(255,255,255,0.12)',
            opacity: i < 7 ? 1 : 1,
            animation: i < 7 ? `${fill} 420ms ease-out ${i * 110}ms both` : 'none'
          }}
        />
      ))}
    </Box>
    <Box sx={{ width: 10, height: 36, bgcolor: 'rgba(255,255,255,0.85)', borderRadius: '0 5px 5px 0' }} />
  </Box>
);

const AuthLayout: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children
}) => (
  <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 6fr' } }}>
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 6,
        bgcolor: brand.night,
        color: '#ECEAF4',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Logo size={30} />
      <Box>
        <Typography
          component="p"
          sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: { md: '2.5rem', lg: '3rem' }, lineHeight: 1.1, maxWidth: 440 }}
        >
          El taller y la tienda, con la carga al día.
        </Typography>
        <Typography sx={{ mt: 2, color: '#B5AFCB', maxWidth: 400, fontSize: '1.0625rem' }}>
          Ventas, inventario de vehículos y repuestos, clientes y equipo de Battiolab en un solo sistema.
        </Typography>
        <ChargingCell />
      </Box>
      <Typography variant="caption" sx={{ color: '#857F9B' }}>
        Battiolab ERP, versión 1.1
      </Typography>
    </Box>

    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, sm: 6 }, bgcolor: 'background.default' }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4, color: 'text.primary' }}>
          <Box sx={{ display: 'inline-flex', bgcolor: brand.night, p: 1.5, borderRadius: 2 }}>
            <Logo size={24} />
          </Box>
        </Box>
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, mb: 4 }}>
          {subtitle}
        </Typography>
        {children}
      </Box>
    </Box>
  </Box>
);

export default AuthLayout;
