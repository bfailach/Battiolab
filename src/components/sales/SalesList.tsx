import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, Alert, Modal } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import salesService, { Sale } from '../../services/sales.service';
import SaleDetails from './SaleDetails';
import NewSale from './NewSale';

const SearchBar = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'white',
    borderRadius: 3,
    '& fieldset': {
      borderColor: '#E0E0E0',
    },
    '&:hover fieldset': {
      borderColor: '#C95792',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#C95792',
    },
  },
});

const SaleCard = styled(Paper)({
  backgroundColor: '#F8B55F',
  borderRadius: 3,
  padding: '16px',
  marginBottom: '16px',
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

const ModalContent = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '1200px',
  maxHeight: '90vh',
  overflow: 'auto',
  outline: 'none',
  backgroundColor: '#F5F5F5',
  borderRadius: 3,
  padding: '24px',
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

const SalesList = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para modales
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setIsLoading(true);
      const data = await salesService.getAll();
      setSales(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las ventas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailsOpen(true);
  };

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setIsEditOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedSale(null);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedSale(null);
  };

  const handleDelete = async (saleId: string) => {
    console.log('Intentando eliminar venta con ID:', saleId);
    if (window.confirm('¿Está seguro que desea eliminar esta venta?')) {
      try {
        if (!saleId) {
          throw new Error('ID de venta no válido');
        }
        await salesService.delete(saleId);
        console.log('Venta eliminada con éxito:', saleId);
        loadSales();
      } catch (err: any) {
        console.error('Error al eliminar venta:', err);
        setError(err.message || 'Error al eliminar la venta');
      }
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#303030', fontWeight: 700 }}>
        Lista de Ventas
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          placeholder="Buscar por cliente"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 400 }}
        />
        <ActionButton>Filtros</ActionButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <ActionButton onClick={() => navigate('/dashboard/sales/new')}>
          Nueva Venta
        </ActionButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Typography>Cargando ventas...</Typography>
      ) : (
        filteredSales.map((sale) => (
          <SaleCard 
            key={sale.id} 
            elevation={2}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Cliente: {sale.client.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Fecha: {formatDate(sale.date)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(sale.total)}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: getStatusColor(sale.status),
                    fontWeight: 600 
                  }}
                >
                  {getStatusText(sale.status)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <ActionButton onClick={() => handleViewDetails(sale)}>
                Ver Detalles
              </ActionButton>
              <ActionButton onClick={() => handleEdit(sale)}>
                Editar
              </ActionButton>
              <Button
                onClick={() => {
                  console.log('Debug - Sale object:', sale);
                  // Use _id as fallback if id is undefined
                  const saleId = sale.id || sale._id;
                  console.log('Debug - Sale ID to use:', saleId);
                  if (saleId) {
                    handleDelete(saleId);
                  } else {
                    setError('No se puede eliminar: ID de venta no encontrado');
                  }
                }}
                sx={{
                  backgroundColor: '#F44336',
                  color: 'white',
                  textTransform: 'none',
                  borderRadius: 3,
                  padding: '8px 16px',
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: '#D32F2F',
                  },
                }}
              >
                Eliminar
              </Button>
            </Box>
          </SaleCard>
        ))
      )}

      {/* Modal de Detalles */}
      <Modal
        open={isDetailsOpen}
        onClose={handleCloseDetails}
      >
        <ModalContent>
          {selectedSale && (
            <SaleDetails
              sale={selectedSale}
              onEdit={() => {
                handleCloseDetails();
                handleEdit(selectedSale);
              }}
              onBack={handleCloseDetails}
            />
          )}
        </ModalContent>
      </Modal>

      {/* Modal de Edición */}
      <Modal
        open={isEditOpen}
        onClose={handleCloseEdit}
      >
        <ModalContent>
          {selectedSale && (
            <NewSale
              isEditing={true}
              initialSale={{...selectedSale}}
              onSaved={() => {
                handleCloseEdit();
                loadSales();
              }}
              onCancel={handleCloseEdit}
            />
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SalesList;
