import React from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, SxProps, Theme, Typography } from '@mui/material';
import { wide } from '../../theme';

export const PageHeader: React.FC<{ title: string; description?: string; actions?: React.ReactNode }> = ({ title, description, actions }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: { xs: 'flex-start', md: 'flex-end' },
      justifyContent: 'space-between',
      flexDirection: { xs: 'column', md: 'row' },
      gap: 2,
      mb: 4
    }}
  >
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.75rem' } }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 620 }}>
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

/** Superficie plana, sin sombra. */
export const Surface: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  padding?: number;
  sx?: SxProps<Theme>;
}> = ({ title, subtitle, action, children, padding = 3, sx }) => (
  <Paper sx={{ borderRadius: 5, overflow: 'hidden', border: '1px solid', borderColor: 'divider', ...sx }}>
    {(title || action) && (
      <Box sx={{ px: 3, pt: 2.75, pb: padding === 0 ? 2 : 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          {title && <Typography variant="h5">{title}</Typography>}
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
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
  accent?: boolean;
}

/** Franja de cifras grandes en tipografía ancha, separadas por líneas. */
export const StatStrip: React.FC<{ stats: Stat[] }> = ({ stats }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${stats.length}, 1fr)` },
      borderTop: '1px solid',
      borderBottom: '1px solid',
      borderColor: 'divider',
      mb: 4
    }}
  >
    {stats.map((s, i) => (
      <Box
        key={s.label}
        sx={{
          py: 2.5,
          pr: 2,
          pl: { xs: i % 2 ? 2 : 0, md: i === 0 ? 0 : 3 },
          borderLeft: { xs: i % 2 ? '1px solid' : 'none', md: i === 0 ? 'none' : '1px solid' },
          borderTop: { xs: i > 1 ? '1px solid' : 'none', md: 'none' },
          borderColor: { xs: 'divider', md: 'divider' }
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {s.label}
        </Typography>
        <Typography component="p" sx={{ ...wide, fontSize: { xs: '1.5rem', lg: '1.875rem' }, mt: 0.5, color: s.accent ? 'charge.main' : 'text.primary', lineHeight: 1.15 }}>
          {s.value}
        </Typography>
        {s.hint && (
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
            {s.hint}
          </Typography>
        )}
      </Box>
    ))}
  </Box>
);

export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }> = ({ icon, title, text, action }) => (
  <Box sx={{ py: 7, px: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    {icon && <Box sx={{ color: 'text.secondary', '& svg': { fontSize: 40 } }}>{icon}</Box>}
    <Typography variant="h4" component="p">
      {title}
    </Typography>
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
    <CircularProgress size={20} sx={{ color: 'charge.main' }} />
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
