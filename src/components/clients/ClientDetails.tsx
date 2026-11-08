import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HistoryIcon from '@mui/icons-material/History';
import DetailDrawer, { DetailRow } from '../shared/DetailDrawer';
import StatusChip, { saleTone } from '../shared/StatusChip';
import { Client } from '../../services/clients.service';
import { Sale, saleStatusLabel } from '../../services/sales.service';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';

const ClientDetails: React.FC<{
  client: Client | null;
  sales: Sale[];
  onClose: () => void;
  onEdit: (c: Client) => void;
  onDelete: (c: Client) => void;
}> = ({ client, sales, onClose, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const own = client ? sales.filter((s) => s.client.id === client.id) : [];
  const valid = own.filter((s) => s.status !== 'cancelled');
  const spent = valid.reduce((sum, s) => sum + s.total, 0);

  return (
    <DetailDrawer
      open={Boolean(client)}
      onClose={onClose}
      title={client?.name || ''}
      subtitle={client && <StatusChip label={client.status ? 'Activo' : 'Inactivo'} tone={client.status ? 'ok' : 'neutral'} />}
      actions={
        client && (
          <>
            <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => onEdit(client)}>
              Editar
            </Button>
            <Button variant="outlined" startIcon={<HistoryIcon />} onClick={() => navigate(`/dashboard/clients/history?client=${client.id}`)}>
              Ver historial
            </Button>
            {isAdmin && (
              <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => onDelete(client)}>
                Eliminar
              </Button>
            )}
          </>
        )
      }
    >
      {client && (
        <>
          <DetailRow label="Documento">{client.document}</DetailRow>
          <DetailRow label="Correo">{client.email}</DetailRow>
          <DetailRow label="Teléfono">{client.phone}</DetailRow>
          <DetailRow label="Cliente desde">{formatDate(client.createdAt)}</DetailRow>
          <DetailRow label="Compras">{valid.length}</DetailRow>
          <DetailRow label="Total comprado">{formatCurrency(spent)}</DetailRow>

          <Typography variant="h5" sx={{ mt: 4, mb: 1.5 }}>
            Últimas compras
          </Typography>
          {own.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Este cliente todavía no tiene compras.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {own.slice(0, 5).map((s) => (
                <Box
                  key={s.id}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {s.items.map((i) => i.productName).join(', ')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.number ? `${s.number}, ` : ''}
                      {formatDate(s.date)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
