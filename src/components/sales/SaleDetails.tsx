import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import BlockIcon from '@mui/icons-material/Block';
import DetailDrawer, { DetailRow } from '../shared/DetailDrawer';
import StatusChip, { saleTone } from '../shared/StatusChip';
import { isOverdue, Sale, saleStatusLabel } from '../../services/sales.service';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { docLabel, formatDocument, FINAL_CONSUMER_DOCUMENT } from '../../utils/validation';

const SaleDetails: React.FC<{
  sale: Sale | null;
  onClose: () => void;
  onInvoice: (s: Sale) => void;
  onPay: (s: Sale) => void;
  onCancel: (s: Sale) => void;
}> = ({ sale, onClose, onInvoice, onPay, onCancel }) => (
  <DetailDrawer
    open={Boolean(sale)}
    onClose={onClose}
    title={sale ? `Factura ${sale.number || ''}`.trim() : ''}
    subtitle={
      sale && (
        <Stack direction="row" spacing={2}>
          <StatusChip label={saleStatusLabel[sale.status]} tone={saleTone[sale.status]} />
          {isOverdue(sale) && <StatusChip label="Vencida" tone="bad" />}
        </Stack>
      )
    }
    width={520}
    actions={
      sale && (
        <>
          <Button variant="contained" startIcon={<DescriptionOutlinedIcon />} onClick={() => onInvoice(sale)}>
            Ver factura
          </Button>
          {sale.status === 'pending' && (
            <Button variant="outlined" startIcon={<PaymentsOutlinedIcon />} onClick={() => onPay(sale)}>
              Registrar pago
            </Button>
          )}
          {sale.status !== 'cancelled' && (
            <Button color="error" startIcon={<BlockIcon />} onClick={() => onCancel(sale)}>
              Anular
            </Button>
          )}
        </>
      )
    }
  >
    {sale && (
      <>
        <DetailRow label="Expedición">{formatDateTime(sale.date)}</DetailRow>
        <DetailRow label="Cliente">
          {sale.customer?.name || sale.client.name}
          <Typography variant="caption" color="text.secondary" component="div">
            {sale.customer?.document === FINAL_CONSUMER_DOCUMENT
              ? 'Consumidor final'
              : sale.customer?.document
              ? `${docLabel(sale.customer.documentType)} ${formatDocument(sale.customer.documentType, sale.customer.document, sale.customer.checkDigit)}`
              : ''}
          </Typography>
        </DetailRow>
        <DetailRow label="Forma de pago">
          {sale.paymentForm === 'credito' ? `Crédito, vence ${formatDate(sale.dueDate)}` : 'Contado'}
        </DetailRow>
        <DetailRow label="Medio de pago">{sale.paymentMethod || 'Pendiente'}</DetailRow>
        {sale.paidAt && sale.paymentForm === 'credito' && <DetailRow label="Pagada el">{formatDate(sale.paidAt)}</DetailRow>}
        {sale.creditNote && (
          <DetailRow label="Nota crédito">
            {sale.creditNote.number}, {formatDate(sale.creditNote.date)}
            <Typography variant="caption" color="text.secondary" component="div">
              {sale.creditNote.reason}
            </Typography>
          </DetailRow>
        )}
        {sale.notes && <DetailRow label="Observaciones">{sale.notes}</DetailRow>}
        <DetailRow label="Registrada por">{sale.createdBy || '—'}</DetailRow>

        <Typography variant="h5" sx={{ mt: 4, mb: 1 }}>
          Productos
        </Typography>
        <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
          {sale.items.map((i) => (
            <Box key={i.productId + i.price} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1.25 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {i.productName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {i.quantity} × {formatCurrency(i.price)} + IVA {i.taxRate} %
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {formatCurrency(i.total)}
              </Typography>
            </Box>
          ))}
        </Stack>
        <Box sx={{ mt: 2, pt: 2, borderTop: '2px solid', borderColor: 'text.primary' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Subtotal
            </Typography>
            <Typography variant="body2">{formatCurrency(sale.subtotal)}</Typography>
          </Box>
          {sale.taxes.map((t) => (
            <Box key={t.rate} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                IVA {t.rate} %
              </Typography>
              <Typography variant="body2">{formatCurrency(t.amount)}</Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="h4" component="p">
              Total
            </Typography>
            <Typography variant="h4" component="p">
              {formatCurrency(sale.total)}
            </Typography>
          </Box>
        </Box>
      </>
    )}
  </DetailDrawer>
);

export default SaleDetails;
