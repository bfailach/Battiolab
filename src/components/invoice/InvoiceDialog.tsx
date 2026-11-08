import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { invoiceHtml, missingCompanyData } from './invoiceHtml';
import { Sale } from '../../services/sales.service';
import settingsService from '../../services/settings.service';
import { useLoad } from '../../hooks/useLoad';
import { Loading } from '../shared/Page';

/** Vista previa de la factura dentro de la app, con impresión o guardado en PDF. */
const InvoiceDialog: React.FC<{ sale: Sale | null; onClose: () => void }> = ({ sale, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const frame = useRef<HTMLIFrameElement>(null);
  const company = useLoad(() => settingsService.get('company'), []);
  const missing = company.data ? missingCompanyData(company.data) : [];

  return (
    <Dialog open={Boolean(sale)} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1 }}>{sale?.number ? `Factura ${sale.number}` : 'Factura'}</Box>
        <IconButton onClick={onClose} aria-label="Cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {missing.length > 0 && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => navigate('/dashboard/company')}>
                Completar
              </Button>
            }
          >
            Faltan datos de la empresa para cumplir los requisitos de la factura: {missing.join(', ')}.
          </Alert>
        )}
        {!sale || !company.data ? (
          <Loading label="Preparando la factura…" />
        ) : (
          <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
            <Box
              component="iframe"
              ref={frame}
              title="Vista previa de la factura"
              srcDoc={invoiceHtml(sale, company.data)}
              sx={{ width: '100%', height: { xs: '70vh', md: '72vh' }, border: 0, display: 'block' }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cerrar
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintOutlinedIcon />}
          disabled={!company.data}
          onClick={() => frame.current?.contentWindow?.print()}
        >
          Imprimir o guardar PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceDialog;
