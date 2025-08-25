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
import { Client } from '../../services/clients.service';

interface ClientDetailsProps {
  client: Client;
  onEdit: () => void;
  onBack: () => void;
}

const StyledPaper = styled(Paper)({
  padding: '24px',
  backgroundColor: 'white',
  borderRadius: 3,
});

const DetailItem = styled(Box)({
  marginBottom: '16px',
});

const DetailLabel = styled(Typography)({
  color: '#666',
  fontSize: '0.875rem',
  marginBottom: '4px',
});

const DetailValue = styled(Typography)({
  color: '#303030',
  fontSize: '1rem',
  fontWeight: 700,
});

const StatusChip = styled(Chip)({
  borderRadius: 3,
  fontWeight: 700,
  '&.active': {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  '&.inactive': {
    backgroundColor: '#FF5252',
    color: 'white',
  },
});

const ActionButton = styled(Button)({
  textTransform: 'none',
  borderRadius: 3,
  padding: '8px 24px',
  fontWeight: 700,
});

const EditButton = styled(ActionButton)({
  backgroundColor: '#3D365C',
  color: 'white',
  '&:hover': {
    backgroundColor: '#2D284C',
  },
});

const BackButton = styled(ActionButton)({
  backgroundColor: '#C95792',
  color: 'white',
  '&:hover': {
    backgroundColor: '#B94B82',
  },
});

const ClientDetails: React.FC<ClientDetailsProps> = ({
  client,
  onEdit,
  onBack,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <StyledPaper elevation={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#303030', fontWeight: 700 }}>
          Detalles del Cliente
        </Typography>
        <StatusChip
          label={client.status ? 'Activo' : 'Inactivo'}
          className={client.status ? 'active' : 'inactive'}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <DetailItem>
            <DetailLabel>Nombre</DetailLabel>
            <DetailValue>{client.name}</DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailLabel>Email</DetailLabel>
            <DetailValue>{client.email}</DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailLabel>Teléfono</DetailLabel>
            <DetailValue>{client.phone}</DetailValue>
          </DetailItem>
        </Grid>

        <Grid item xs={12} md={6}>
          <DetailItem>
            <DetailLabel>Última Compra</DetailLabel>
            <DetailValue>
              {client.lastPurchase ? formatDate(client.lastPurchase) : 'Sin compras'}
            </DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailLabel>Total de Compras</DetailLabel>
            <DetailValue>{client.totalPurchases || 0}</DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailLabel>Cliente desde</DetailLabel>
            <DetailValue>{formatDate(client.createdAt)}</DetailValue>
          </DetailItem>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <BackButton onClick={onBack}>
          Volver
        </BackButton>
        <EditButton onClick={onEdit}>
          Editar Cliente
        </EditButton>
      </Box>
    </StyledPaper>
  );
};

export default ClientDetails; 