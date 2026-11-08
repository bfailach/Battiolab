import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { brand } from '../../theme';

export type ChargeLevel = 'empty' | 'low' | 'ok';

export const levelColor: Record<ChargeLevel, string> = { empty: brand.empty, low: brand.low, ok: brand.ok };

interface ChargeMeterProps {
  /** Proporción de 0 a 1. */
  value: number;
  level: ChargeLevel;
  segments?: number;
  width?: number;
  height?: number;
  label?: React.ReactNode;
  tooltip?: string;
  /** Para usar sobre fondos oscuros (p. ej. tarjetas con imagen), sin importar el tema. */
  inverse?: boolean;
}

/**
 * Medidor segmentado tipo batería: el elemento firma de Battiolab.
 * Se usa para niveles de stock y para cualquier indicador de "carga" (avance, cobertura).
 */
const ChargeMeter: React.FC<ChargeMeterProps> = ({
  value,
  level,
  segments = 10,
  width = 96,
  height = 14,
  label,
  tooltip,
  inverse
}) => {
  const theme = useTheme();
  const ink = inverse ? '#FFFFFF' : theme.palette.text.primary;
  const filled = value <= 0 ? 0 : Math.max(1, Math.round(Math.min(value, 1) * segments));
  const color = levelColor[level];
  const meter = (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <Box
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(value, 1) * 100)}
        sx={{ display: 'inline-flex', alignItems: 'center' }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${segments}, 1fr)`,
            gap: '2px',
            p: '2px',
            width,
            height,
            borderRadius: '4px',
            border: `1.5px solid ${alpha(ink, 0.35)}`
          }}
        >
          {Array.from({ length: segments }).map((_, i) => (
            <Box
              key={i}
              sx={{
                borderRadius: '1.5px',
                bgcolor: i < filled ? color : alpha(ink, inverse ? 0.14 : 0.08)
              }}
            />
          ))}
        </Box>
        <Box
          sx={{
            width: 3,
            height: height * 0.45,
            ml: '1px',
            borderRadius: '0 2px 2px 0',
            bgcolor: alpha(ink, 0.35)
          }}
        />
      </Box>
      {label !== undefined && (
        <Typography variant="body2" sx={{ fontWeight: 600, color: level === 'ok' ? (inverse ? '#FFFFFF' : 'text.primary') : color }}>
          {label}
        </Typography>
      )}
    </Box>
  );
  return tooltip ? <Tooltip title={tooltip}>{meter}</Tooltip> : meter;
};

/** Nivel de stock según el mínimo del producto (o el umbral general si no tiene mínimo). */
export const stockLevel = (stock: number, minStock: number, threshold = 5): ChargeLevel => {
  if (stock <= 0) return 'empty';
  const min = minStock > 0 ? minStock : threshold;
  return stock <= min ? 'low' : 'ok';
};

export const StockMeter: React.FC<{ stock: number; minStock: number; threshold?: number; width?: number; inverse?: boolean }> = ({
  stock,
  minStock,
  threshold = 5,
  width,
  inverse
}) => {
  const min = minStock > 0 ? minStock : threshold;
  const level = stockLevel(stock, minStock, threshold);
  return (
    <ChargeMeter
      value={stock / (min * 3)}
      level={level}
      width={width}
      inverse={inverse}
      label={`${stock} u.`}
      tooltip={level === 'empty' ? 'Agotado' : level === 'low' ? `En o bajo el mínimo (${min} u.)` : `Mínimo: ${min} u.`}
    />
  );
};

export default ChargeMeter;
