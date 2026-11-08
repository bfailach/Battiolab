import React from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * Rejilla de formulario: columnas iguales, mismo espacio vertical y campos alineados arriba
 * aunque unos tengan texto de ayuda y otros no.
 */
export const FormGrid: React.FC<{ children: React.ReactNode; columns?: 1 | 2 | 3 }> = ({ children, columns = 2 }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: `repeat(${columns}, minmax(0, 1fr))` },
      columnGap: 2,
      rowGap: 2.25,
      alignItems: 'start'
    }}
  >
    {children}
  </Box>
);

/** Ocupa todas las columnas de la rejilla. */
export const Full: React.FC<{ children: React.ReactNode }> = ({ children }) => <Box sx={{ gridColumn: '1 / -1' }}>{children}</Box>;

export const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box sx={{ gridColumn: '1 / -1', pt: 1 }}>
    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const FormDialog: React.FC<{
  open: boolean;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  error?: string | null;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md';
  description?: string;
}> = ({ open, title, submitLabel, onClose, onSubmit, submitting, error, children, maxWidth = 'sm', description }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth={maxWidth} fullWidth fullScreen={fullScreen}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        noValidate
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {description}
            </Typography>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {/* Espacio superior para que la etiqueta flotante del primer campo no se corte */}
          <Box sx={{ pt: 1 }}>{children}</Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Guardando…' : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FormDialog;
