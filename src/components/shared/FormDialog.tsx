import React from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/** Diálogo estándar para formularios de crear/editar. */
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
}> = ({ open, title, submitLabel, onClose, onSubmit, submitting, error, children, maxWidth = 'sm' }) => {
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
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {children}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
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
