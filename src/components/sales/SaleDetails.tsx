import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DetailDrawer, { DetailRow } from '../shared/DetailDrawer';
import StatusChip, { saleTone } from '../shared/StatusChip';
import { Sale, SaleStatus, saleStatusLabel } from '../../services/sales.service';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { printReceipt } from './receipt';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

const SaleDetails: React.FC<{
  sale: Sale | null;
  onClose: () => void;
  onStatus: (sale: Sale, status: SaleStatus) => void;
  onDelete: (sale: Sale) => void;
}> = ({ sale, onClose, onStatus, onDelete }) => {
  const { isAdmin } = useAuth();
  const { notify } = useUI();
  return (
    <DetailDrawer
      open={Boolean(sale)}
      onClose={onClose}
      title={sale ? `Venta ${sale.number || ''}`.trim() : ''}
      subtitle={sale && <StatusChip label={saleStatusLabel[sale.status]} tone={saleTone[sale.status]} />}
      actions={
        sale && (
          <>
            <Button
              variant="outlined"
              startIcon={<PrintOutlinedIcon />}
              onClick={() => !printReceipt(sale) && notify('Permite ventanas emergentes para imprimir', 'warning')}
            >
              Imprimir
            </Button>
            {sale.status === 'pending' && (
              <Button variant="contained" startIcon={<CheckCircleOutlineIcon />} onClick={() => onStatus(sale, 'completed')}>
                Marcar completada
              </Button>
            )}
            {sale.status !== 'cancelled' && (
              <Button color="error" variant="outlined" startIcon={<BlockIcon />} onClick={() => onStatus(sale, 'cancelled')}>
                Anular
              </Button>
            )}
            {sale.status === 'cancelled' && (
              <Button variant="outlined" onClick={() => onStatus(sale, 'pending')}>
                Reactivar
              </Button>
            )}
            {isAdmin && (
              <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => onDelete(sale)}>
                Eliminar
              </Button>
            )}
          </>
        )
      }
    >
      {sale && (
        <>
          <DetailRow label="Fecha">{formatDateTime(sale.date)}</DetailRow>
          <DetailRow label="Cliente">
            {sale.client.name}
            {sale.client.email && (
              <Typography variant="caption" color="text.secondary" component="div">
                {sale.client.email}
                {sale.client.phone ? `, ${sale.client.phone}` : ''}
              </Typography>
            )}
          </DetailRow>
          <DetailRow label="Método de pago">{sale.paymentMethod || '—'}</DetailRow>
          {sale.notes && <DetailRow label="Notas">{sale.notes}</DetailRow>}

          <Typography variant="h5" sx={{ mt: 4, mb: 1 }}>
            Productos
          </Typography>
          <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
            {sale.items.map((i) => (
              <Box key={i.productId + i.price} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1.25 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {i.productName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {i.quantity} × {formatCurrency(i.price)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(i.subtotal)}
                </Typography>
              </Box>
            ))}
          </Stack>
          <Box sx={{ mt: 2, pt: 2, borderTop: '2px solid', borderColor: 'text.primary' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2">{formatCurrency(sale.subtotal)}</Typography>
            </Box>
            {sale.taxRate > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Impuesto ({sale.taxRate} %)</Typography>
                <Typography variant="body2">{formatCurrency(sale.taxAmount)}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="h4" component="p">Total</Typography>
              <Typography variant="h4" component="p">{formatCurrency(sale.total)}</Typography>
            </Box>
          </Box>
        </>
      )}
    </DetailDrawer>
  );
};

export default SaleDetails;
