import React from 'react';
import { Box, Typography } from '@mui/material';
import { brand, headingFont } from '../../theme';

/** Marca: celda de batería cargada + wordmark en Niramit. */
const Logo: React.FC<{ size?: number; color?: string; showText?: boolean }> = ({
  size = 28,
  color = '#FFFFFF',
  showText = true
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="7" width="23" height="18" rx="4" fill="none" stroke={color} strokeWidth="2.4" />
      <rect x="27" y="12.5" width="3" height="7" rx="1.2" fill={color} />
      <rect x="7" y="11" width="4" height="10" rx="1" fill={brand.charge} />
      <rect x="12.5" y="11" width="4" height="10" rx="1" fill={brand.charge} />
      <rect x="18" y="11" width="4" height="10" rx="1" fill={brand.magenta} />
    </svg>
    {showText && (
      <Typography
        component="span"
        sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: size * 0.72, color, letterSpacing: '-0.01em' }}
      >
        Battiolab
      </Typography>
    )}
  </Box>
);

export default Logo;
