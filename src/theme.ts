import { alpha, createTheme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

/**
 * Battiolab: lienzo negro, tipografía blanca ancha y pesada, botones tipo píldora
 * y un solo acento de marca: el ámbar "carga".
 */
export const brand = {
  black: '#000000',
  night: '#0F0F10',
  raised: '#18181A',
  violet: '#3D365C',
  violetSoft: '#7C4585',
  magenta: '#C95792',
  charge: '#F8B55F',
  ok: '#3DD68C',
  low: '#F5A524',
  empty: '#FF5A5F'
};

export const displayFont = '"Archivo Variable", "Figtree Variable", system-ui, sans-serif';
export const bodyFont = '"Figtree Variable", system-ui, -apple-system, "Segoe UI", sans-serif';
/** Ancho expandido de Archivo para titulares y cifras. */
export const wide = { fontFamily: displayFont, fontStretch: '115%', fontWeight: 800, letterSpacing: '-0.01em' } as const;

declare module '@mui/material/styles' {
  interface Palette {
    line: string;
    surface: { base: string; raised: string; sunken: string };
    sidebar: { bg: string; text: string; muted: string; hover: string; active: string; activeText: string };
  }
  interface PaletteOptions {
    line?: string;
    surface?: { base: string; raised: string; sunken: string };
    sidebar?: { bg: string; text: string; muted: string; hover: string; active: string; activeText: string };
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    charge: true;
  }
}

declare module '@mui/material/styles' {
  interface Palette {
    charge: Palette['primary'];
  }
  interface PaletteOptions {
    charge?: PaletteOptions['primary'];
  }
}

export const createAppTheme = (mode: PaletteMode) => {
  const dark = mode === 'dark';
  const bg = dark ? '#000000' : '#F2F2F0';
  const paper = dark ? '#0F0F10' : '#FFFFFF';
  const raised = dark ? '#18181A' : '#F7F7F5';
  const line = dark ? '#262628' : '#E2E2DE';
  const text = dark ? '#FFFFFF' : '#0A0A0A';
  const muted = dark ? '#9C9CA3' : '#5F5F66';

  return createTheme({
    palette: {
      mode,
      primary: { main: text, contrastText: dark ? '#000000' : '#FFFFFF' },
      secondary: { main: brand.magenta, contrastText: '#FFFFFF' },
      charge: { main: brand.charge, dark: '#E9A23F', light: '#FFD08C', contrastText: '#000000' },
      warning: { main: brand.low },
      error: { main: brand.empty },
      success: { main: dark ? brand.ok : '#1F9D62' },
      info: { main: dark ? '#7FB7FF' : '#2F6FD0' },
      background: { default: bg, paper },
      text: { primary: text, secondary: muted, disabled: dark ? '#5A5A60' : '#A8A8AE' },
      divider: line,
      action: {
        hover: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        selected: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'
      },
      line,
      surface: { base: paper, raised, sunken: dark ? '#080809' : '#EBEBE7' },
      sidebar: {
        bg: dark ? '#000000' : '#0A0A0A',
        text: '#FFFFFF',
        muted: '#8E8E95',
        hover: 'rgba(255,255,255,0.07)',
        active: '#FFFFFF',
        activeText: '#000000'
      }
    },
    shape: { borderRadius: 4 },
    typography: {
      fontFamily: bodyFont,
      fontSize: 14,
      h1: { ...wide, fontSize: '2.75rem', lineHeight: 1.05 },
      h2: { ...wide, fontSize: '2rem', lineHeight: 1.1 },
      h3: { ...wide, fontSize: '1.5rem', lineHeight: 1.15 },
      h4: { ...wide, fontSize: '1.25rem', lineHeight: 1.2 },
      h5: { fontFamily: displayFont, fontStretch: '108%', fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.3 },
      h6: { fontFamily: displayFont, fontStretch: '105%', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.35 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
      body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      caption: { fontSize: '0.75rem', lineHeight: 1.4 },
      button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0 }
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { fontVariantNumeric: 'tabular-nums', backgroundColor: bg },
          '*:focus-visible': { outline: `2px solid ${brand.charge}`, outlineOffset: 2 },
          '::selection': { background: brand.charge, color: '#000' },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': { transition: 'none !important', animation: 'none !important' }
          },
          'input[type=number]': { MozAppearance: 'textfield' },
          'input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 }
        }
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' }, outlined: { borderColor: line } }
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 999, paddingInline: 20, minHeight: 40, fontSize: '0.875rem' },
          sizeSmall: { minHeight: 32, paddingInline: 14, fontSize: '0.8125rem' },
          sizeLarge: { minHeight: 50, paddingInline: 28, fontSize: '0.9375rem' },
          outlined: { borderColor: dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.25)', '&:hover': { borderColor: text } },
          containedPrimary: { '&:hover': { backgroundColor: dark ? '#E6E6E6' : '#2A2A2A' } }
        }
      },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 999 } } },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: { backgroundColor: raised, borderRadius: 999, padding: 3, gap: 2 },
          grouped: { border: 0, borderRadius: '999px !important', margin: 0 }
        }
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            border: 0,
            paddingInline: 14,
            color: muted,
            '&.Mui-selected': { backgroundColor: text, color: dark ? '#000' : '#fff', '&:hover': { backgroundColor: text } }
          },
          sizeSmall: { paddingTop: 5, paddingBottom: 5 }
        }
      },
      MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
      MuiFormControl: { defaultProps: { size: 'small' } },
      MuiInputLabel: { styleOverrides: { root: { fontWeight: 500 } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: raised,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: line },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: dark ? '#4A4A4F' : '#B5B5B0' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: brand.charge, borderWidth: 1.5 }
          },
          input: { '&::placeholder': { color: muted, opacity: 0.8 } }
        }
      },
      MuiFormHelperText: { styleOverrides: { root: { marginLeft: 4, marginRight: 4 } } },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 999 },
          sizeSmall: { height: 24 },
          outlined: { borderColor: line },
          filled: { '&.MuiChip-colorPrimary': { backgroundColor: text, color: dark ? '#000' : '#fff' } }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: line, paddingTop: 13, paddingBottom: 13 },
          head: { fontWeight: 600, fontSize: '0.75rem', color: muted, backgroundColor: 'transparent', whiteSpace: 'nowrap', letterSpacing: '0.02em' }
        }
      },
      MuiTableRow: {
        styleOverrides: { hover: { '&:hover': { backgroundColor: dark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.025)' } } }
      },
      MuiTableSortLabel: { styleOverrides: { root: { '&.Mui-active': { color: text } } } },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 24, border: `1px solid ${line}`, backgroundColor: paper },
          paperFullScreen: { borderRadius: 0, border: 0 }
        }
      },
      MuiDialogTitle: { styleOverrides: { root: { ...wide, fontSize: '1.375rem', paddingTop: 24, paddingBottom: 8 } } },
      MuiDialogActions: { styleOverrides: { root: { padding: '16px 24px 24px', gap: 8 } } },
      MuiDrawer: { styleOverrides: { paper: { backgroundColor: paper, backgroundImage: 'none', borderLeft: `1px solid ${line}` } } },
      MuiMenu: { styleOverrides: { paper: { borderRadius: 16, border: `1px solid ${line}`, backgroundColor: raised } } },
      MuiAutocomplete: { styleOverrides: { paper: { borderRadius: 14, border: `1px solid ${line}`, backgroundColor: raised } } },
      MuiPopover: { styleOverrides: { paper: { backgroundImage: 'none' } } },
      MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700, minHeight: 44, fontSize: '0.9375rem' } } },
      MuiTabs: { styleOverrides: { root: { minHeight: 44 }, indicator: { height: 3, borderRadius: 3, backgroundColor: brand.charge } } },
      MuiTooltip: { styleOverrides: { tooltip: { fontSize: '0.75rem', backgroundColor: dark ? '#2A2A2D' : '#0A0A0A', borderRadius: 8 } } },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 14, alignItems: 'center' },
          standardInfo: { backgroundColor: alpha('#7FB7FF', dark ? 0.1 : 0.12) },
          standardWarning: { backgroundColor: alpha(brand.low, dark ? 0.12 : 0.14) },
          standardError: { backgroundColor: alpha(brand.empty, dark ? 0.12 : 0.1) },
          standardSuccess: { backgroundColor: alpha(brand.ok, dark ? 0.1 : 0.12) }
        }
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: { '&.Mui-checked': { color: '#000', '& + .MuiSwitch-track': { backgroundColor: brand.charge, opacity: 1 } } },
          thumb: { boxShadow: 'none' },
          track: { borderRadius: 10 }
        }
      },
      MuiTablePagination: { styleOverrides: { root: { color: muted } } },
      MuiBreadcrumbs: { styleOverrides: { separator: { color: muted } } },
      MuiLink: { defaultProps: { underline: 'hover' }, styleOverrides: { root: { color: text, fontWeight: 600 } } }
    }
  });
};
