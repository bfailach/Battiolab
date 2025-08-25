import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Modal, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import productsService, { Product } from '../../services/products.service';
import ProductForm from './ProductForm';
import ProductDetails from './ProductDetails';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SubNavigation from '../shared/SubNavigation';

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

const CategoryButton = styled(ActionButton)({
  backgroundColor: '#C95792',
  color: 'white',
  '&:hover': {
    backgroundColor: '#B94B82',
  },
  '&.active': {
    backgroundColor: '#3D365C',
  }
});

const AddButton = styled(ActionButton)({
  backgroundColor: '#3D365C',
  color: 'white',
  '&:hover': {
    backgroundColor: '#2D284C',
  },
});

const ProductCard = styled(Paper)({
  backgroundColor: '#F8B55F',
  borderRadius: 3,
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

const ActionBar = styled(Box)({
  display: 'flex',
  gap: '8px',
  '& button': {
    flex: 1,
    backgroundColor: '#3D365C',
    color: 'white',
    '&:hover': {
      backgroundColor: '#2D284C',
    },
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

const categories = ['Scooters', 'Motos', 'Baterías', 'Repuestos'] as const;

const navItems = [
  { path: 'data', label: 'Datos' },
  { path: 'alerts', label: 'Alertas' },
  { path: 'products', label: 'Productos' },
  { path: 'lots', label: 'Lotes' },
  { path: 'scanning', label: 'Escaneo' }
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const InventoryData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productsService.getAll(selectedCategory || undefined);
      setProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (data: any) => {
    try {
      await productsService.create(data);
      await loadProducts();
      setIsFormOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateProduct = async (data: any) => {
    if (!selectedProduct?.id) {
      setError('Error: No se puede actualizar el producto porque no tiene un ID válido');
      return;
    }
    try {
      await productsService.update(selectedProduct.id, data);
      await loadProducts();
      setIsFormOpen(false);
      setSelectedProduct(null);
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el producto');
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      await productsService.updateStock(productId, newStock);
      await loadProducts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedProduct(null);
    setIsEditing(false);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedProduct(null);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(prev => prev === category ? null : category);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await productsService.delete(productId);
      await loadProducts();
      setIsDetailsOpen(false);
      setSelectedProduct(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el producto');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#303030', fontWeight: 700 }}>
        Inventario
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          placeholder="Buscar producto"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 400 }}
        />
        <ActionButton>Filtros</ActionButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <AddButton 
          key="add-button"
          onClick={() => setIsFormOpen(true)}
        >
          Agregar Producto
        </AddButton>
        {categories.map((category, index) => (
          <CategoryButton
            key={`category-${index}-${category}`}
            onClick={() => handleCategoryClick(category)}
            className={selectedCategory === category ? 'active' : ''}
          >
            {category}
          </CategoryButton>
        ))}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} key="error-alert">
          {error}
        </Alert>
      )}

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
        gap: 3 
      }}>
        {filteredProducts.map((product, index) => (
          <ProductCard 
            key={product.id ? `product-${product.id}` : `product-temp-${index}`} 
            elevation={2}
          >
            <Box sx={{ 
              height: 150, 
              backgroundColor: '#E0E0E0', 
              borderRadius: 1,
              mb: 1,
              backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {product.name}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {product.sku}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Stock: {product.stock} unidades
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Precio: {formatCurrency(product.price)}
            </Typography>
            <ActionBar>
              <Button 
                variant="contained"
                onClick={() => handleEditClick(product)}
              >
                Editar
              </Button>
              <Button 
                variant="contained"
                onClick={() => handleViewDetails(product)}
              >
                Stock
              </Button>
            </ActionBar>
          </ProductCard>
        ))}
      </Box>

      {/* Modal para el formulario */}
      <Modal
        open={isFormOpen}
        onClose={handleCloseForm}
      >
        <ModalContent>
          <ProductForm
            initialData={selectedProduct || undefined}
            onSubmit={isEditing ? handleUpdateProduct : handleCreateProduct}
            onCancel={handleCloseForm}
            isEditing={isEditing}
          />
        </ModalContent>
      </Modal>

      {/* Modal para los detalles y stock */}
      <Modal
        open={isDetailsOpen}
        onClose={handleCloseDetails}
      >
        <ModalContent>
          {selectedProduct && (
            <ProductDetails
              product={selectedProduct}
              onEdit={() => {
                handleCloseDetails();
                handleEditClick(selectedProduct);
              }}
              onUpdateStock={handleUpdateStock}
              onBack={handleCloseDetails}
              onDelete={handleDeleteProduct}
            />
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
};

const InventoryPage = () => {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || '';

  return (
    <Box>
      <SubNavigation
        items={navItems}
        basePath="/dashboard/inventory"
        currentPath={currentPath}
      />

      <Routes>
        <Route path="/" element={<Navigate to="data" replace />} />
        <Route path="data" element={<InventoryData />} />
        <Route path="alerts" element={<Box p={3}>Alertas (en desarrollo)</Box>} />
        <Route path="products" element={<Box p={3}>Productos (en desarrollo)</Box>} />
        <Route path="lots" element={<Box p={3}>Lotes (en desarrollo)</Box>} />
        <Route path="scanning" element={<Box p={3}>Escaneo (en desarrollo)</Box>} />
      </Routes>
    </Box>
  );
};

export default InventoryPage; 