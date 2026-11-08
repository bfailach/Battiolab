import React from 'react';
import { Box, Divider, Drawer, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/** Panel lateral de detalle: mantiene la lista visible detrás. */
const DetailDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}> = ({ open, onClose, title, subtitle, actions, children, width = 460 }) => (
  <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: width }, borderTopLeftRadius: { sm: 24 }, borderBottomLeftRadius: { sm: 24 } } }}>
    <Box sx={{ p: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h3" component="h2" sx={{ wordBreak: 'break-word' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography component="div" variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <IconButton onClick={onClose} aria-label="Cerrar" edge="end">
        <CloseIcon />
      </IconButton>
    </Box>
    {actions && <Box sx={{ px: 3, pb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
    <Divider />
    <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>{children}</Box>
  </Drawer>
);

export const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 2, py: 1.4, borderBottom: '1px solid', borderColor: 'divider' }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography component="div" variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
      {children}
    </Typography>
  </Box>
);

export default DetailDrawer;
