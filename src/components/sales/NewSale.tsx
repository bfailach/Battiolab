import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Paper,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import clientsService, { Client } from '../../services/clients.service';
import productsService, { Product } from '../../services/products.service';
import salesService, { CreateSaleData, Sale, SaleItem } from '../../services/sales.service';
import { useNavigate } from 'react-router-dom';

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

const ItemPaper = styled(Paper)({
  padding: '16px',
  marginBottom: '16px',
  backgroundColor: '#F8B55F',
  borderRadius: 3,
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface NewSaleProps {
  isEditing?: boolean;
  initialSale?: Sale;
  onSaved?: () => void;
  onCancel?: () => void;
}

const NewSale = ({ 
  isEditing = false, 
  initialSale, 
  onSaved, 
  onCancel 
}: NewSaleProps) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [status, setStatus] = useState<'completed' | 'pending'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadClientsAndProducts();
  }, []);
  
  useEffect(() => {
    if (isEditing && initialSale) {
      console.log('Cargando datos para editar venta con ID:', initialSale.id);
      // Cargar datos iniciales para edición
      setSelectedClient({
        id: initialSale.client.id,
        name: initialSale.client.name,
        _id: initialSale.client.id,
        document: '',
        email: '',
        phone: '',
        status: true,
        createdAt: '',
        updatedAt: ''
      });
      setItems(initialSale.items);
      setStatus(initialSale.status as 'completed' | 'pending');
    }
  }, [isEditing, initialSale]);

  const loadClientsAndProducts = async () => {
    try {
      const [clientsData, productsData] = await Promise.all([
        clientsService.getAll(),
        productsService.getAll()
      ]);
      setClients(clientsData);
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    }
  };

  const handleAddItem = () => {
    setItems([...items, {
      productId: '',
      productName: '',
      quantity: 1,
      price: 0,
      subtotal: 0
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, product: Product | null) => {
    if (!product) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      productName: product.name,
      price: product.price,
      subtotal: product.price * newItems[index].quantity
    };
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      quantity,
      subtotal: newItems[index].price * quantity
    };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async () => {
    if (!selectedClient) {
      setError('Por favor seleccione un cliente');
      return;
    }

    if (items.length === 0) {
      setError('Por favor agregue al menos un producto');
      return;
    }

    if (items.some(item => !item.productId || item.quantity <= 0)) {
      setError('Por favor complete todos los campos de los productos');
      return;
    }

    try {
      setIsLoading(true);
      const saleData: CreateSaleData = {
        client: {
          id: selectedClient._id,
          name: selectedClient.name
        },
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        total: calculateTotal(),
        status: status
      };

      if (isEditing && initialSale && initialSale.id) {
        console.log('Actualizando venta existente con ID:', initialSale.id);
        await salesService.update(initialSale.id, saleData);
      } else {
        console.log('Creando nueva venta');
        await salesService.create(saleData);
      }
      
      if (onSaved) {
        onSaved();
      } else {
        navigate('/dashboard/sales/list');
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar la venta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#303030', fontWeight: 700 }}>
        {isEditing ? 'Editar Venta' : 'Nueva Venta'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Autocomplete
          options={clients}
          getOptionLabel={(client) => `${client.name} - ${client.document || ''}`}
          value={selectedClient}
          onChange={(_, newValue) => setSelectedClient(newValue)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Cliente"
              variant="outlined"
              required
              sx={{ backgroundColor: 'white' }}
            />
          )}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Productos
        </Typography>

        {items.map((item, index) => (
          <ItemPaper key={`item-${index}-${item.productId || 'new'}`} elevation={2}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Autocomplete
                options={products}
                getOptionLabel={(product) => `${product.name} - ${product.sku || ''}`}
                value={products.find(p => p.id === item.productId) || null}
                onChange={(_, newValue) => handleProductChange(index, newValue)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Producto"
                    variant="outlined"
                    required
                    sx={{ backgroundColor: 'white', flex: 2 }}
                  />
                )}
                sx={{ flex: 2 }}
              />

              <TextField
                type="number"
                label="Cantidad"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                variant="outlined"
                required
                sx={{ backgroundColor: 'white', flex: 1 }}
              />

              <TextField
                label="Precio"
                value={formatCurrency(item.price)}
                variant="outlined"
                disabled
                sx={{ backgroundColor: 'white', flex: 1 }}
              />

              <TextField
                label="Subtotal"
                value={formatCurrency(item.subtotal)}
                variant="outlined"
                disabled
                sx={{ backgroundColor: 'white', flex: 1 }}
              />

              <IconButton 
                onClick={() => handleRemoveItem(index)}
                sx={{ mt: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </ItemPaper>
        ))}

        <ActionButton onClick={handleAddItem} sx={{ mt: 2 }}>
          Agregar Producto
        </ActionButton>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Total: {formatCurrency(calculateTotal())}
        </Typography>

        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'completed' | 'pending')}
            label="Estado"
          >
            <MenuItem value="completed">Completada</MenuItem>
            <MenuItem value="pending">Pendiente</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <ActionButton
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Guardar Venta'}
        </ActionButton>

        <Button
          variant="outlined"
          onClick={onCancel || (() => navigate('/dashboard/sales/list'))}
          sx={{ borderColor: '#3D365C', color: '#3D365C' }}
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  );
};

export default NewSale;
