import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryIcon from '@mui/icons-material/History';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import DetailDrawer, { DetailRow } from '../shared/DetailDrawer';
import StatusChip, { saleTone } from '../shared/StatusChip';
import { Client } from '../../services/clients.service';
import { Sale, saleStatusLabel } from '../../services/sales.service';
import { formatCurrency, formatDate } from '../../utils/format';
import { docLabel, formatDocument, formatPhone } from '../../utils/validation';

const ClientDetails: React.FC<{
  client: Client | null;
  sales: Sale[];
  onClose: () => void;
  onEdit: (c: Client) => void;
  onToggleStatus: (c: Client) => void;
  onOpenInvoice: (s: Sale) => void;
}> = ({ client, sales, onClose, onEdit, onToggleStatus, onOpenInvoice }) => {
  const navigate = useNavigate();
  const own = client ? sales.filter((s) => s.client.id === client.id) : [];
  const valid = own.filter((s) => s.status !== 'cancelled');
  const spent = valid.reduce((sum, s) => sum + s.total, 0);
  const owed = own.filter((s) => s.status === 'pending').reduce((sum, s) => sum + s.total, 0);

  return (
    <DetailDrawer
      open={Boolean(client)}
      onClose={onClose}
      title={client?.name || ''}
      subtitle={client && <StatusChip label={client.status ? 'Activo' : 'Inactivo'} tone={client.status ? 'ok' : 'neutral'} />}
      actions={
        client && (
          <>
            <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => onEdit(client)}>
              Editar
            </Button>
            <Button variant="outlined" startIcon={<HistoryIcon />} onClick={() => navigate(`/dashboard/clients/history?client=${client.id}`)}>
              Historial
            </Button>
            <Button
              color="inherit"
              startIcon={client.status ? <PersonOffOutlinedIcon /> : <HowToRegOutlinedIcon />}
              onClick={() => onToggleStatus(client)}
            >
              {client.status ? 'Desactivar' : 'Activar'}
            </Button>
          </>
        )
      }
    >
      {client && (
        <>
          <DetailRow label="Tipo">{client.personType === 'juridica' ? 'Empresa' : 'Persona natural'}</DetailRow>
          <DetailRow label="Documento">
            {docLabel(client.documentType)} {formatDocument(client.documentType, client.document, client.checkDigit)}
          </DetailRow>
          <DetailRow label="Teléfono">{formatPhone(client.phone)}</DetailRow>
          <DetailRow label="Correo">{client.email || '—'}</DetailRow>
          <DetailRow label="Dirección">{[client.address, client.city].filter(Boolean).join(', ') || '—'}</DetailRow>
          <DetailRow label="Cliente desde">{formatDate(client.createdAt)}</DetailRow>
          <DetailRow label="Compras">
            {valid.length} por {formatCurrency(spent)}
          </DetailRow>
          {owed > 0 && <DetailRow label="Saldo por cobrar">{formatCurrency(owed)}</DetailRow>}

          <Typography variant="h5" sx={{ mt: 4, mb: 1.5 }}>
            Últimas facturas
          </Typography>
          {own.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Este cliente todavía no tiene compras.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {own.slice(0, 6).map((s) => (
                <Box
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenInvoice(s)}
                  onKeyDown={(e) => e.key === 'Enter' && onOpenInvoice(s)}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: 'surface.raised',
                    cursor: 'pointer',
                    '&:hover': { outline: '1px solid', outlineColor: 'divider' }
                  }}
                >
                  <ReceiptLongOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {s.number} <Typography component="span" variant="caption" color="text.secondary">{formatDate(s.date)}</Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="div" noWrap>
                      {s.items.map((i) => i.productName).join(', ')}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatCurrency(s.total)}
                    </Typography>
                    <StatusChip label={saleStatusLabel[s.status]} tone={saleTone[s.status]} />
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </>
      )}
    </DetailDrawer>
  );
};

export default ClientDetails;
