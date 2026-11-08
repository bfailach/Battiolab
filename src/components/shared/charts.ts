import { useTheme } from '@mui/material/styles';
import { brand } from '../../theme';

/** Colores y estilos de ejes coherentes con el tema activo para Recharts. */
export const useChartStyle = () => {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  return {
    colors: dark ? [brand.charge, brand.magenta, brand.violetLight, brand.violetSoft, brand.ok, '#6FAEDB'] : [brand.violet, brand.magenta, brand.charge, brand.violetSoft, '#1F9D62', '#4F8FBF'],
    grid: theme.palette.divider,
    axis: { fontSize: 12, fill: theme.palette.text.secondary },
    tooltip: {
      contentStyle: {
        background: theme.palette.surface.raised,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 12,
        fontSize: 13,
        color: theme.palette.text.primary
      },
      itemStyle: { color: theme.palette.text.primary },
      labelStyle: { color: theme.palette.text.secondary },
      cursor: { fill: dark ? 'rgba(255,255,255,0.05)' : 'rgba(61,54,92,0.05)' }
    }
  };
};
