import React from 'react';
import { Box, Typography } from '@mui/material';
import { brand, wide } from '../../theme';

/** Marca: celda sin borne con un bloque de carga y la chispa ámbar + wordmark ancho en minúsculas. */
const Logo: React.FC<{ size?: number; color?: string; showText?: boolean }> = ({ size = 28, color = '#FFFFFF', showText = true }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="7.5" width="24" height="17" rx="4.5" fill="none" stroke={color} strokeWidth="2.6" />
      <rect x="7.9" y="11.2" width="10.6" height="9.6" rx="1.4" fill={brand.primarySoft} />
      <rect x="20" y="11.2" width="4.1" height="9.6" rx="1.2" fill={brand.charge} />
    </svg>
    {showText && (
      <Typography component="span" sx={{ ...wide, fontSize: size * 0.7, color, letterSpacing: '-0.02em' }}>
        battiolab
      </Typography>
    )}
  </Box>
);

export default Logo;
