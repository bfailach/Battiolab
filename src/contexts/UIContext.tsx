import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  PaletteMode,
  Snackbar
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '../theme';

type Severity = 'success' | 'error' | 'info' | 'warning';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
}

interface UIContextType {
  mode: PaletteMode;
  toggleMode: () => void;
  notify: (message: string, severity?: Severity) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI debe usarse dentro de UIProvider');
  return ctx;
};

const MODE_KEY = 'battiolab:mode';

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* sin almacenamiento */
    }
    // El diseño de Battiolab parte del tema oscuro
    return 'dark';
  });
  const [toast, setToast] = useState<{ message: string; severity: Severity; key: number } | null>(null);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const toggleMode = useCallback(() => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(MODE_KEY, next);
      } catch {
        /* sin almacenamiento */
      }
      return next;
    });
  }, []);

  const notify = useCallback((message: string, severity: Severity = 'success') => {
    setToast({ message, severity, key: Date.now() });
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...options, resolve })),
    []
  );

  const close = (value: boolean) => {
    dialog?.resolve(value);
    setDialog(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UIContext.Provider value={{ mode, toggleMode, notify, confirm }}>
        {children}
        <Snackbar
          key={toast?.key}
          open={Boolean(toast)}
          autoHideDuration={4000}
          onClose={() => setToast(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          {toast ? (
            <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
              {toast.message}
            </Alert>
          ) : undefined}
        </Snackbar>
        <Dialog open={Boolean(dialog)} onClose={() => close(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{dialog?.title}</DialogTitle>
          {dialog?.message && (
            <DialogContent>
              <DialogContentText>{dialog.message}</DialogContentText>
            </DialogContent>
          )}
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => close(false)} color="inherit">
              Cancelar
            </Button>
            <Button
              onClick={() => close(true)}
              variant="contained"
              color={dialog?.destructive ? 'error' : 'primary'}
              autoFocus
            >
              {dialog?.confirmLabel}
            </Button>
          </DialogActions>
        </Dialog>
      </UIContext.Provider>
    </ThemeProvider>
  );
};
