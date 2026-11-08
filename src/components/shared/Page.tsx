import React from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, SxProps, Theme, Typography } from '@mui/material';

export const PageHeader: React.FC<{ title: string; description?: string; actions?: React.ReactNode }> = ({
  title,
  description,
  actions
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: { xs: 'flex-start', md: 'flex-end' },
      justifyContent: 'space-between',
      flexDirection: { xs: 'column', md: 'row' },
      gap: 2,
      mb: 3
    }}
  >
    <Box sx={{ maxWidth: 680 }}>
      <Typography variant="h2" component="h1">
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      )}
    </Box>
    {actions && (
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
        {actions}
      </Stack>
    )}
  </Box>
);

/** Superficie con borde (sin sombra) y encabezado opcional. */
export const Surface: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  padding?: number;
  sx?: SxProps<Theme>;
}> = ({ title, subtitle, action, children, padding = 2.5, sx }) => (
  <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', ...sx }}>
    {(title || action) && (
      <Box
        sx={{
          px: 2.5,
          pt: 2,
          pb: padding === 0 ? 2 : 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box>
          {title && <Typography variant="h5">{title}</Typography>}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
    )}
    <Box sx={{ p: padding }}>{children}</Box>
  </Paper>
);

export interface Stat {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

/** Una sola franja de métricas separadas por divisores, en vez de tarjetas sueltas. */
export const StatStrip: React.FC<{ stats: Stat[] }> = ({ stats }) => (
  <Paper
    variant="outlined"
    sx={{
      borderRadius: 3,
      display: 'grid',
      gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${stats.length}, 1fr)` },
      mb: 3
    }}
  >
    {stats.map((s, i) => (
      <Box
        key={s.label}
        sx={{
          px: 2.5,
          py: 2,
          borderLeft: { md: i === 0 ? 'none' : '1px solid' },
          borderTop: { xs: i > 1 ? '1px solid' : 'none', md: 'none' },
          borderColor: { xs: 'divider', md: 'divider' }
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {s.label}
        </Typography>
        <Typography variant="h3" component="p" sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
          {s.value}
        </Typography>
        {s.hint && (
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.25 }}>
            {s.hint}
          </Typography>
        )}
      </Box>
    ))}
  </Paper>
);

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
}> = ({ icon, title, text, action }) => (
  <Box sx={{ py: 6, px: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    {icon && <Box sx={{ color: 'text.secondary', '& svg': { fontSize: 40 } }}>{icon}</Box>}
    <Typography variant="h5">{title}</Typography>
    {text && (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {text}
      </Typography>
    )}
    {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
  </Box>
);

export const Loading: React.FC<{ label?: string }> = ({ label = 'Cargando…' }) => (
  <Box sx={{ py: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, color: 'text.secondary' }}>
    <CircularProgress size={20} />
    <Typography variant="body2">{label}</Typography>
  </Box>
);

export const LoadError: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <Alert
    severity="error"
    action={
      onRetry && (
        <Button color="inherit" size="small" onClick={onRetry}>
          Reintentar
        </Button>
      )
    }
  >
    {message}
  </Alert>
);

/** Envuelve la vista: muestra carga o error antes del contenido. */
export function LoadGate<T>({
  state,
  children
}: {
  state: { data: T | null; loading: boolean; error: string | null; reload: () => void };
  children: (data: T) => React.ReactNode;
}) {
  if (state.error) return <LoadError message={state.error} onRetry={state.reload} />;
  if (state.loading && !state.data) return <Loading />;
  if (!state.data) return null;
  return <>{children(state.data)}</>;
}
