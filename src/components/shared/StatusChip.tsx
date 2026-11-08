import React from 'react';
import { Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { brand } from '../../theme';

type Tone = 'ok' | 'warn' | 'bad' | 'neutral' | 'brand';

const toneColor: Record<Tone, string> = {
  ok: brand.ok,
  warn: brand.low,
  bad: brand.empty,
  neutral: '#857F9B',
  brand: brand.magenta
};

const StatusChip: React.FC<{ label: string; tone?: Tone }> = ({ label, tone = 'neutral' }) => (
  <Chip
    size="small"
    label={label}
    sx={{
      bgcolor: alpha(toneColor[tone], 0.14),
      color: toneColor[tone],
      '& .MuiChip-label': { px: 1.25 }
    }}
  />
);

export const saleTone = { completed: 'ok', pending: 'warn', cancelled: 'bad' } as const;

export default StatusChip;
