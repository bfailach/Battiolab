import { alpha, createTheme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

/**
 * Battiolab: violeta de marca + magenta como énfasis + ámbar "carga" como acento firma
 * (medidores de batería, indicador de navegación activa).
 */
export const brand = {
  night: '#221D33',
  violet: '#3D365C',
  violetSoft: '#7C4585',
  magenta: '#C95792',
  charge: '#F8B55F',
  ok: '#2E9E6B',
  low: '#E08A2E',
  empty: '#D64550'
};

export const headingFont = '"Niramit", "Figtree Variable", system-ui, sans-serif';
export const bodyFont = '"Figtree Variable", system-ui, -apple-system, "Segoe UI", sans-serif';

declare module '@mui/material/styles' {
  interface Palette {
    line: string;
    sidebar: { bg: string; text: string; muted: string; hover: string };
  }
  interface PaletteOptions {
    line?: string;
    sidebar?: { bg: string; text: string; muted: string; hover: string };
  }
}

export const createAppTheme = (mode: PaletteMode) => {
  const light = mode === 'light';
  const line = light ? '#E4E2EC' : '#2E2940';
  const paper = light ? '#FFFFFF' : '#1E1A2A';

  return createTheme({
    palette: {
      mode,
      primary: { main: light ? brand.violet : '#A69BDB', contrastText: light ? '#FFFFFF' : '#15121E' },
      secondary: { main: brand.magenta, contrastText: '#FFFFFF' },
      warning: { main: brand.low },
      error: { main: brand.empty },
      success: { main: brand.ok },
      background: { default: light ? '#F4F3F8' : '#15121E', paper },
      text: {
        primary: light ? '#221D33' : '#ECEAF4',
        secondary: light ? '#625C78' : '#A39DB8'
      },
      divider: line,
      line,
      sidebar: {
        bg: light ? brand.night : '#100D18',
        text: '#ECEAF4',
        muted: '#9C95B5',
        hover: 'rgba(255,255,255,0.06)'
      }
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: bodyFont,
      fontSize: 14,
      h1: { fontFamily: headingFont, fontWeight: 700, fontSize: '2rem', lineHeight: 1.2 },
      h2: { fontFamily: headingFont, fontWeight: 700, fontSize: '1.625rem', lineHeight: 1.25 },
      h3: { fontFamily: headingFont, fontWeight: 700, fontSize: '1.375rem', lineHeight: 1.3 },
      h4: { fontFamily: headingFont, fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.3 },
      h5: { fontFamily: headingFont, fontWeight: 600, fontSize: '1.0625rem', lineHeight: 1.35 },
      h6: { fontFamily: headingFont, fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.4 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
      body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      caption: { fontSize: '0.75rem', lineHeight: 1.4 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 }
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { fontVariantNumeric: 'tabular-nums' },
          '*:focus-visible': { outline: `2px solid ${brand.charge}`, outlineOffset: 2 },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': { transition: 'none !important', animation: 'none !important' }
          }
        }
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' }, outlined: { borderColor: line } }
      },
      MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderRadius: 12 } } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 8, paddingInline: 16, minHeight: 38 }, sizeSmall: { minHeight: 32, paddingInline: 12 } }
      },
      MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
      MuiFormControl: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { backgroundColor: paper, '& .MuiOutlinedInput-notchedOutline': { borderColor: line } }
        }
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 999 }, sizeSmall: { height: 24 } } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: line, paddingTop: 12, paddingBottom: 12 },
          head: {
            fontWeight: 600,
            fontSize: '0.8125rem',
            color: light ? '#625C78' : '#A39DB8',
            backgroundColor: light ? '#FAF9FC' : '#221E30',
            whiteSpace: 'nowrap'
          }
        }
      },
      MuiTableRow: {
        styleOverrides: { hover: { '&:hover': { backgroundColor: alpha(brand.violet, light ? 0.035 : 0.15) } } }
      },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 14, border: `1px solid ${line}` } } },
      MuiDialogTitle: { styleOverrides: { root: { fontFamily: headingFont, fontWeight: 700, fontSize: '1.25rem' } } },
      MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, minHeight: 44 } } },
      MuiTabs: { styleOverrides: { root: { minHeight: 44 } } },
      MuiTooltip: { styleOverrides: { tooltip: { fontSize: '0.75rem', backgroundColor: brand.night } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } }
    }
  });
};
