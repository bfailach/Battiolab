import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Sale } from '../../services/sales.service';

interface SaleDetailsProps {
  sale: Sale;
  onEdit: () => void;
  onBack: () => void;
}

const DetailPaper = styled(Paper)({
  padding: '24px',
  backgroundColor: 'white',
  borderRadius: 3,
});

const ActionButton = styled(Button)({
  backgroundColor: '#3D365C',
  color: 'white',
  textTransform: 'none',
  borderRadius: 3,
  padding: '8px 16px',
  fontWeight: 700,
  '&:hover': {
    backgroundColor: '#2D284C',
  },
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return '#4CAF50';
    case 'pending':
      return '#FFC107';
    case 'cancelled':
      return '#F44336';
    default:
      return '#757575';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Completada';
    case 'pending':
      return 'Pendiente';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
};

const SaleDetails = ({ sale, onEdit, onBack }: SaleDetailsProps) => {
  return (
    <DetailPaper elevation={2}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#303030' }}>
          Detalles de la Venta
        </Typography>
        <Chip
          label={getStatusText(sale.status)}
          sx={{
            backgroundColor: getStatusColor(sale.status),
            color: 'white',
            fontWeight: 600,
          }}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Información del Cliente
          </Typography>
          <Typography>
            <strong>Nombre:</strong> {sale.client.name}
          </Typography>
          <Typography>
            <strong>Fecha:</strong> {formatDate(sale.date)}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Resumen de la Venta
          </Typography>
          <Typography>
            <strong>Total:</strong> {formatCurrency(sale.total)}
          </Typography>
          <Typography>
            <strong>Items:</strong> {sale.items.length}
          </Typography>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Productos
      </Typography>

      {sale.items.map((item, index) => (
        <Paper
          key={`${item.productId}-${index}`}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: '#F8B55F',
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {item.productName || 'Producto'}
              </Typography>
              <Typography variant="body2">
                Cantidad: {item.quantity}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2">
                Precio: {formatCurrency(item.price)}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Subtotal: {formatCurrency(item.subtotal)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      ))}

      <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
        <ActionButton onClick={onEdit}>
          Editar Venta
        </ActionButton>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{ borderColor: '#3D365C', color: '#3D365C' }}
        >
          Volver
        </Button>
      </Box>
    </DetailPaper>
  );
};

export default SaleDetails;
