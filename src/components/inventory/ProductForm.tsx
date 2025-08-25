import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Product } from '../../services/products.service';

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const StyledPaper = styled(Paper)({
  padding: '24px',
  backgroundColor: 'white',
  borderRadius: 3,
});

const FormContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

const ButtonContainer = styled(Box)({
  display: 'flex',
  gap: '12px',
  justifyContent: 'flex-end',
  marginTop: '24px',
});

const categories = ['Scooters', 'Motos', 'Baterías', 'Repuestos'] as const;
type ProductStatus = 'active' | 'inactive' | 'discontinued';

const ProductForm = ({ initialData, onSubmit, onCancel, isEditing }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    category: initialData?.category || 'Scooters',
    description: initialData?.description || '',
    price: initialData?.price?.toString() || '',
    stock: initialData?.stock || 0,
    minStock: initialData?.minStock || 5,
    imageUrl: initialData?.imageUrl || '',
    status: initialData?.status || 'active'
  });

  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: string) => {
    // Eliminar cualquier caracter que no sea número
    const numericValue = value.replace(/[^\d]/g, '');
    // Formatear con separadores de miles
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'stock' || name === 'minStock') {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
    } else if (name === 'price') {
      // Manejar el precio como string para el formato
      const formattedValue = formatCurrency(value);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else if (name === 'sku') {
      // Solo permitir letras, números y guiones
      const skuValue = value.replace(/[^A-Za-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, [name]: skuValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!formData.sku.trim()) {
      setError('El SKU es requerido');
      return;
    }
    
    // Convertir el precio formateado a número
    const price = parseFloat(formData.price.replace(/,/g, ''));
    if (isNaN(price) || price <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }
    if (formData.stock < 0) {
      setError('El stock no puede ser negativo');
      return;
    }
    if (formData.minStock < 0) {
      setError('El stock mínimo no puede ser negativo');
      return;
    }

    onSubmit({
      ...formData,
      price: price // Enviar el precio como número
    });
  };

  return (
    <StyledPaper>
      <Typography variant="h5" sx={{ mb: 3, color: '#303030', fontWeight: 700 }}>
        {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <FormContainer>
          <TextField
            name="name"
            label="Nombre"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
          />

          <TextField
            name="sku"
            label="SKU"
            value={formData.sku}
            onChange={handleChange}
            fullWidth
            required
            disabled={isEditing}
            helperText="Solo letras, números y guiones"
            error={formData.sku.length > 0 && !/^[A-Za-z0-9-]+$/.test(formData.sku)}
          />

          <FormControl fullWidth>
            <InputLabel>Categoría</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleSelectChange}
              label="Categoría"
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            name="description"
            label="Descripción"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />

          <TextField
            name="price"
            label="Precio (COP)"
            value={formData.price}
            onChange={handleChange}
            fullWidth
            required
            InputProps={{
              startAdornment: <span style={{ marginRight: 8 }}>$</span>,
            }}
            helperText="Ingrese el valor en pesos colombianos"
          />

          <TextField
            name="stock"
            label="Stock"
            type="number"
            value={formData.stock}
            onChange={handleChange}
            fullWidth
            required
            inputProps={{ min: 0 }}
          />

          <TextField
            name="minStock"
            label="Stock Mínimo"
            type="number"
            value={formData.minStock}
            onChange={handleChange}
            fullWidth
            required
            inputProps={{ min: 0 }}
          />

          <TextField
            name="imageUrl"
            label="URL de Imagen"
            value={formData.imageUrl}
            onChange={handleChange}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleSelectChange}
              label="Estado"
            >
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="inactive">Inactivo</MenuItem>
              <MenuItem value="discontinued">Descontinuado</MenuItem>
            </Select>
          </FormControl>

          <ButtonContainer>
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{
                borderColor: '#C95792',
                color: '#C95792',
                '&:hover': {
                  borderColor: '#B94B82',
                  backgroundColor: 'rgba(201, 87, 146, 0.04)',
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: '#3D365C',
                '&:hover': {
                  backgroundColor: '#2D284C',
                },
              }}
            >
              {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </ButtonContainer>
        </FormContainer>
      </form>
    </StyledPaper>
  );
};

export default ProductForm; 