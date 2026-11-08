import React from 'react';
import { Box, Typography } from '@mui/material';
import { brand } from '../../theme';

type Tone = 'ok' | 'warn' | 'bad' | 'neutral' | 'brand';

const toneColor: Record<Tone, string> = { ok: brand.ok, warn: brand.low, bad: brand.empty, neutral: '#8E8E95', brand: brand.charge };

/** Estado como punto de color + texto: se lee rápido y no pelea con el contenido. */
const StatusChip: React.FC<{ label: string; tone?: Tone }> = ({ label, tone = 'neutral' }) => (
  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }}>
    <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: toneColor[tone], flexShrink: 0 }} />
    <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
      {label}
    </Typography>
  </Box>
);

export const saleTone = { completed: 'ok', pending: 'warn', cancelled: 'bad' } as const;

export default StatusChip;
