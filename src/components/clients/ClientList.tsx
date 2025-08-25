import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Chip, Modal } from '@mui/material';
import { styled } from '@mui/material/styles';
import ClientForm from './ClientForm';
import ClientDetails from './ClientDetails';
import clientsService, { Client, CreateClientData } from '../../services/clients.service';

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

const ActionButton = styled(Button)({
  textTransform: 'none',
  borderRadius: 3,
  padding: '8px 16px',
  fontWeight: 700,
});

const AddButton = styled(ActionButton)({
  backgroundColor: '#3D365C',
  color: 'white',
  '&:hover': {
    backgroundColor: '#2D284C',
  },
});

const ClientCard = styled(Paper)({
  backgroundColor: '#F8B55F',
  borderRadius: 3,
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
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

const ModalContent = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '800px',
  maxHeight: '90vh',
  overflow: 'auto',
  outline: 'none',
});

const ClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const data = await clientsService.getAll();
      setClients(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (data: CreateClientData) => {
    try {
      // Ensure document is explicitly provided as a string
      const processedData = {
        ...data,
        document: String(data.document).trim()
      };
      
      console.log('ClientList - Processed data before API call:', processedData);
      
      await clientsService.create(processedData);
      await loadClients();
      setIsFormOpen(false);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Error creating client:', err);
      // Extract the actual error message
      const errorMessage = err.response?.data?.error || err.message || 'Error al crear el cliente';
      setError(errorMessage);
    }
  };

  const handleUpdateClient = async (data: CreateClientData) => {
    if (!selectedClient) return;
    try {
      // Usar _id en lugar de id para la actualización
      await clientsService.update(selectedClient._id, data);
      await loadClients();
      setIsFormOpen(false);
      setSelectedClient(null);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedClient(null);
    setIsEditing(false);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedClient(null);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#303030', fontWeight: 700 }}>
        Listado de Clientes
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          placeholder="Buscar cliente"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 400 }}
        />
        <ActionButton>Filtros</ActionButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <AddButton onClick={() => setIsFormOpen(true)}>
          Agregar Cliente
        </AddButton>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: 3 
      }}>
        {filteredClients.map(client => (
          <ClientCard key={client._id} elevation={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {client.name}
              </Typography>
              <StatusChip
                label={client.status ? 'Activo' : 'Inactivo'}
                className={client.status ? 'active' : 'inactive'}
              />
            </Box>
            
            <Typography variant="body2" sx={{ color: '#666' }}>
              {client.email}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              {client.phone}
            </Typography>
            
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Última compra: {formatDate(client.lastPurchase)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Total compras: {client.totalPurchases || 0}
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              mt: 2 
            }}>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => handleViewDetails(client)}
                sx={{ 
                  backgroundColor: '#3D365C',
                  '&:hover': {
                    backgroundColor: '#2D284C',
                  }
                }}
              >
                Ver Detalles
              </Button>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => handleEditClick(client)}
                sx={{ 
                  backgroundColor: '#C95792',
                  '&:hover': {
                    backgroundColor: '#B94B82',
                  }
                }}
              >
                Editar
              </Button>
            </Box>
          </ClientCard>
        ))}
      </Box>

      {/* Modal para el formulario */}
      <Modal
        open={isFormOpen}
        onClose={handleCloseForm}
      >
        <ModalContent>
          <ClientForm
            initialData={selectedClient || undefined}
            onSubmit={isEditing ? handleUpdateClient : handleCreateClient}
            onCancel={handleCloseForm}
            isEditing={isEditing}
          />
        </ModalContent>
      </Modal>

      {/* Modal para los detalles */}
      <Modal
        open={isDetailsOpen}
        onClose={handleCloseDetails}
      >
        <ModalContent>
          {selectedClient && (
            <ClientDetails
              client={selectedClient}
              onEdit={() => {
                handleCloseDetails();
                handleEditClick(selectedClient);
              }}
              onBack={handleCloseDetails}
            />
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ClientList;
