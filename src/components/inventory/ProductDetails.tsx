import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Chip,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Product } from '../../services/products.service';

interface ProductDetailsProps {
  product: Product;
  onEdit: () => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onBack: () => void;
  onDelete: (productId: string) => void;
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
    backgroundColor: '#FF9800',
    color: 'white',
  },
  '&.discontinued': {
    backgroundColor: '#FF5252',
    color: 'white',
  },
});

const ButtonContainer = styled(Box)({
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '24px',
});

const ProductDetails = ({ product, onEdit, onUpdateStock, onBack, onDelete }: ProductDetailsProps) => {
  const [newStock, setNewStock] = useState(product.stock.toString());
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleStockUpdate = async (newStock: number) => {
    if (!product?.id) {
      setError('Error: No se puede actualizar el stock porque el producto no tiene un ID válido');
      return;
    }
    try {
      await onUpdateStock(product.id, newStock);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el stock');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'discontinued':
        return 'Descontinuado';
      default:
        return status;
    }
  };

  const handleDelete = () => {
    if (product?.id) {
      onDelete(product.id);
    }
  };

  return (
    <StyledPaper>
      <Typography variant="h5" sx={{ mb: 3, color: '#303030', fontWeight: 700 }}>
        Detalles del Producto
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <DetailItem>
          <DetailLabel>Nombre</DetailLabel>
          <DetailValue>{product.name}</DetailValue>
        </DetailItem>

        <DetailItem>
          <DetailLabel>SKU</DetailLabel>
          <DetailValue>{product.sku}</DetailValue>
        </DetailItem>

        <DetailItem>
          <DetailLabel>Categoría</DetailLabel>
          <DetailValue>{product.category}</DetailValue>
        </DetailItem>

        <DetailItem>
          <DetailLabel>Estado</DetailLabel>
          <StatusChip
            label={getStatusLabel(product.status)}
            className={product.status}
          />
        </DetailItem>

        <DetailItem>
          <DetailLabel>Precio</DetailLabel>
          <DetailValue>${product.price}</DetailValue>
        </DetailItem>

        <DetailItem>
          <DetailLabel>Stock Mínimo</DetailLabel>
          <DetailValue>{product.minStock} unidades</DetailValue>
        </DetailItem>

        {product.description && (
          <DetailItem>
            <DetailLabel>Descripción</DetailLabel>
            <DetailValue>{product.description}</DetailValue>
          </DetailItem>
        )}

        <DetailItem>
          <DetailLabel>Fecha de Creación</DetailLabel>
          <DetailValue>{formatDate(product.createdAt)}</DetailValue>
        </DetailItem>

        <DetailItem>
          <DetailLabel>Última Actualización</DetailLabel>
          <DetailValue>{formatDate(product.updatedAt)}</DetailValue>
        </DetailItem>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" sx={{ mb: 2, color: '#303030', fontWeight: 700 }}>
        Actualizar Stock
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <TextField
          label="Nuevo Stock"
          type="number"
          value={newStock}
          onChange={(e) => setNewStock(e.target.value)}
          fullWidth
          sx={{ maxWidth: 200 }}
          inputProps={{ min: 0 }}
        />
        <Button
          variant="contained"
          onClick={() => handleStockUpdate(parseInt(newStock))}
          sx={{
            backgroundColor: '#3D365C',
            '&:hover': {
              backgroundColor: '#2D284C',
            },
          }}
        >
          Actualizar
        </Button>
      </Box>

      <ButtonContainer>
        <Button
          variant="outlined"
          color="error"
          onClick={() => setIsDeleteDialogOpen(true)}
          sx={{
            borderColor: '#d32f2f',
            color: '#d32f2f',
            '&:hover': {
              borderColor: '#b71c1c',
              backgroundColor: 'rgba(211, 47, 47, 0.04)',
            },
          }}
        >
          Eliminar
        </Button>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{
            borderColor: '#C95792',
            color: '#C95792',
            '&:hover': {
              borderColor: '#B94B82',
              backgroundColor: 'rgba(201, 87, 146, 0.04)',
            },
          }}
        >
          Volver
        </Button>
        <Button
          variant="contained"
          onClick={onEdit}
          sx={{
            backgroundColor: '#3D365C',
            '&:hover': {
              backgroundColor: '#2D284C',
            },
          }}
        >
          Editar Producto
        </Button>
      </ButtonContainer>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          ¿Está seguro que desea eliminar el producto <strong>{product.name}</strong>? Esta acción no se puede deshacer.
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setIsDeleteDialogOpen(false)}
            sx={{ color: '#666' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </StyledPaper>
  );
};

export default ProductDetails; 