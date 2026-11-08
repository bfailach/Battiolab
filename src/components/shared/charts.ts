import { useTheme } from '@mui/material/styles';
import { brand } from '../../theme';

const light = [brand.violet, brand.magenta, brand.charge, '#4F8FBF', brand.ok, brand.violetSoft];
const dark = ['#A69BDB', brand.magenta, brand.charge, '#6FAEDB', '#4CC290', '#B78AD0'];

/** Colores y estilos de ejes coherentes con el tema activo para Recharts. */
export const useChartStyle = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return {
    colors: isDark ? dark : light,
    grid: theme.palette.divider,
    axis: { fontSize: 12, fill: theme.palette.text.secondary },
    tooltip: {
      contentStyle: {
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 8,
        fontSize: 13,
        color: theme.palette.text.primary
      },
      cursor: { fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(61,54,92,0.05)' }
    }
  };
};
