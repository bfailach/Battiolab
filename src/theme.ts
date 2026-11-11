import { alpha, createTheme } from '@mui/material/styles';

/**
 * Paleta Battiolab "Índigo profundo": tinta índigo #1E1B4B, índigo #4338CA como primario
 * y ámbar #F59E0B solo como la chispa de carga (logo, navegación activa, avisos puntuales).
 * Tipografía ancha y pesada y botones tipo píldora.
 */
export const brand = {
  night: '#121029',
  ink: '#1E1B4B',
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  primarySoft: '#A5B4FC',
  primaryMuted: '#818CF8',
  charge: '#F59E0B',
  chargeDark: '#D97706',
  chargeLight: '#FCD34D',
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
    selected: { bg: string; text: string };
    surface: { base: string; raised: string; sunken: string };
    sidebar: { bg: string; text: string; muted: string; hover: string; active: string; activeText: string };
  }
  interface PaletteOptions {
    line?: string;
    selected?: { bg: string; text: string };
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

/** Battiolab usa solo tema oscuro. */
export const createAppTheme = () => {
  const bg = brand.night;
  const paper = '#1A1838';
  const raised = '#232047';
  const line = '#322E5C';
  const text = '#F4F4FB';
  const muted = '#A9A7C9';
  const primary = brand.primary;
  const primaryHover = brand.primaryHover;

  return createTheme({
    palette: {
      mode: 'dark',
      primary: { main: primary, contrastText: '#FFFFFF' },
      secondary: { main: brand.primarySoft, contrastText: brand.ink },
      charge: { main: brand.charge, dark: brand.chargeDark, light: brand.chargeLight, contrastText: brand.ink },
      warning: { main: brand.low },
      error: { main: brand.empty },
      success: { main: brand.ok },
      info: { main: brand.primarySoft },
      background: { default: bg, paper },
      text: { primary: text, secondary: muted, disabled: '#6A6890' },
      divider: line,
      action: {
        hover: 'rgba(255,255,255,0.06)',
        selected: 'rgba(255,255,255,0.1)'
      },
      line,
      selected: { bg: brand.primary, text: '#FFFFFF' },
      surface: { base: paper, raised, sunken: '#0D0B1F' },
      sidebar: {
        bg: brand.ink,
        text: '#FFFFFF',
        muted: '#C7C5E0',
        hover: 'rgba(255,255,255,0.08)',
        active: brand.charge,
        activeText: brand.ink
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
          '::selection': { background: brand.charge, color: brand.ink },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': { transition: 'none !important', animation: 'none !important' }
          },
          // El espacio del scroll queda reservado: el contenido no salta al cambiar entre páginas largas y cortas
          html: { scrollbarGutter: 'stable', scrollbarWidth: 'thin', scrollbarColor: `${'#3D3970'} transparent` },
          '::-webkit-scrollbar': { width: 10, height: 10 },
          '::-webkit-scrollbar-track': { background: 'transparent' },
          '::-webkit-scrollbar-thumb': {
            backgroundColor: '#3D3970',
            borderRadius: 999,
            border: '3px solid transparent',
            backgroundClip: 'content-box'
          },
          '::-webkit-scrollbar-thumb:hover': { backgroundColor: brand.primary },
          '::-webkit-scrollbar-corner': { background: 'transparent' },
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
          outlined: { borderColor: 'rgba(255,255,255,0.3)', color: text, '&:hover': { borderColor: text } },
          containedPrimary: { '&:hover': { backgroundColor: primaryHover } }
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
            '&.Mui-selected': { backgroundColor: brand.primary, color: '#FFFFFF', '&:hover': { backgroundColor: brand.primaryHover } }
          },
          sizeSmall: { paddingTop: 5, paddingBottom: 5 }
        }
      },
      MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
      MuiFormControl: { defaultProps: { size: 'small' } },
      MuiInputLabel: { styleOverrides: { root: { fontWeight: 500, '&.Mui-focused': { color: brand.primarySoft } } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: raised,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: line },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4A4690' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: brand.primaryMuted, borderWidth: 1.5 }
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
          filled: { '&.MuiChip-colorPrimary': { backgroundColor: brand.primary, color: '#FFFFFF' } }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: line, paddingTop: 13, paddingBottom: 13 },
          head: { fontWeight: 600, fontSize: '0.75rem', color: muted, backgroundColor: 'transparent', whiteSpace: 'nowrap', letterSpacing: '0.02em' }
        }
      },
      MuiTableRow: {
        styleOverrides: { hover: { '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' } } }
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
      MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700, minHeight: 44, fontSize: '0.9375rem', '&.Mui-selected': { color: text } } } },
      MuiTabs: { styleOverrides: { root: { minHeight: 44 }, indicator: { height: 3, borderRadius: 3, backgroundColor: brand.charge } } },
      MuiTooltip: { styleOverrides: { tooltip: { fontSize: '0.75rem', backgroundColor: brand.ink, borderRadius: 8 } } },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 14, alignItems: 'center' },
          standardInfo: { backgroundColor: alpha(brand.primarySoft, 0.12) },
          standardWarning: { backgroundColor: alpha(brand.low, 0.12) },
          standardError: { backgroundColor: alpha(brand.empty, 0.12) },
          standardSuccess: { backgroundColor: alpha(brand.ok, 0.1) }
        }
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: { '&.Mui-checked': { color: '#FFFFFF', '& + .MuiSwitch-track': { backgroundColor: brand.primary, opacity: 1 } } },
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
