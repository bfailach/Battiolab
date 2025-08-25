import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link, Routes, Route } from 'react-router-dom';
import Navbar from './navigation/Navbar';
import ClientsPage from './clients/ClientsPage';
import EmployeesPage from './employees/EmployeesPage';
import InventoryPage from './inventory/InventoryPage';
import SalesPage from './sales/SalesPage';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import InventoryIcon from '@mui/icons-material/Inventory';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Servicios
import clientsService from '../services/clients.service';
import employeesService from '../services/employees.service';
import productsService from '../services/products.service';
import salesService, { Sale } from '../services/sales.service';

// Estilos personalizados
const DashboardCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
  }
}));

const ModuleButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#3D365C',
  color: '#fff',
  '&:hover': {
    backgroundColor: '#2C284C',
  }
}));

const StatCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'white',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  borderRadius: '8px',
}));

const StatNumber = styled(Typography)({
  fontSize: '2rem',
  fontWeight: 700,
  color: '#3D365C',
});

// Función para formatear moneda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const Dashboard: React.FC = () => {
  // Estados para datos
  const [clientsCount, setClientsCount] = useState<number>(0);
  const [employeesCount, setEmployeesCount] = useState<number>(0);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [sales, setSales] = useState<Sale[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [topProducts, setTopProducts] = useState<{name: string, quantity: number}[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Cargar datos de todos los servicios en paralelo
        const [clientsData, employeesData, productsData, salesData] = await Promise.all([
          clientsService.getAll(),
          employeesService.getAll(),
          productsService.getAll(),
          salesService.getAll()
        ]);

        // Actualizar contadores
        setClientsCount(clientsData.length);
        setEmployeesCount(employeesData.length);
        setProductsCount(productsData.length);
        
        // Calcular productos con bajo stock (menos de 10 unidades)
        const lowStock = productsData.filter((product: any) => 
          product.stock && product.stock < 10
        ).length;
        setLowStockCount(lowStock);
        
        // Procesamiento de ventas
        setSales(salesData);
        
        // Ventas recientes (últimas 5)
        const sortedSales = [...salesData].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setRecentSales(sortedSales.slice(0, 5));
        
        // Productos más vendidos
        const productMap = new Map<string, {name: string, quantity: number}>();
        
        salesData.forEach((sale: Sale) => {
          sale.items.forEach(item => {
            const productName = item.productName || `Producto ${item.productId}`;
            
            if (!productMap.has(item.productId)) {
              productMap.set(item.productId, {
                name: productName,
                quantity: 0
              });
            }
            
            const product = productMap.get(item.productId)!;
            product.quantity += item.quantity;
          });
        });
        
        // Convertir a array y ordenar por cantidad
        const topProductsArray = Array.from(productMap.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
          
        setTopProducts(topProductsArray);
        
      } catch (err: any) {
        setError(err.message || 'Error al cargar datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calcular métricas de ventas
  const calculateSalesMetrics = () => {
    if (sales.length === 0) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        averageTicket: 0,
        pendingSales: 0
      };
    }

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const averageTicket = totalRevenue / totalSales;
    const pendingSales = sales.filter(sale => sale.status === 'pending').length;

    return {
      totalSales,
      totalRevenue,
      averageTicket,
      pendingSales
    };
  };

  const salesMetrics = calculateSalesMetrics();

  return (
    <Box>
      <Navbar />
      
      <Routes>
        <Route path="/" element={
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4, color: '#303030', fontWeight: 700 }}>
              Dashboard
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {/* Sección 1: Tarjetas de contadores principales */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ bgcolor: '#3D365C', mr: 1 }}>
                            <PeopleAltIcon />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">
                            Clientes
                          </Typography>
                        </Box>
                        <StatNumber>{clientsCount}</StatNumber>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <Link to="/dashboard/clients" style={{ textDecoration: 'none' }}>
                            <Button size="small">Ver más</Button>
                          </Link>
                        </Box>
                      </CardContent>
                    </StatCard>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ bgcolor: '#3D365C', mr: 1 }}>
                            <BusinessCenterIcon />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">
                            Empleados
                          </Typography>
                        </Box>
                        <StatNumber>{employeesCount}</StatNumber>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <Link to="/dashboard/employees" style={{ textDecoration: 'none' }}>
                            <Button size="small">Ver más</Button>
                          </Link>
                        </Box>
                      </CardContent>
                    </StatCard>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ bgcolor: '#3D365C', mr: 1 }}>
                            <PointOfSaleIcon />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">
                            Ventas Totales
                          </Typography>
                        </Box>
                        <StatNumber>{salesMetrics.totalSales}</StatNumber>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <Link to="/dashboard/sales" style={{ textDecoration: 'none' }}>
                            <Button size="small">Ver más</Button>
                          </Link>
                        </Box>
                      </CardContent>
                    </StatCard>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ bgcolor: '#3D365C', mr: 1 }}>
                            <InventoryIcon />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">
                            Productos
                          </Typography>
                        </Box>
                        <StatNumber>{productsCount}</StatNumber>
                        {lowStockCount > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Chip 
                              size="small" 
                              color="warning" 
                              label={`${lowStockCount} con bajo stock`} 
                            />
                          </Box>
                        )}
                      </CardContent>
                    </StatCard>
                  </Grid>
                </Grid>

                {/* Sección 2: Métricas de ventas y productos */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <DashboardCard>
                      <CardHeader title="Resumen de Ventas" />
                      <Divider />
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Ingresos Totales
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {formatCurrency(salesMetrics.totalRevenue)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Ticket Promedio
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {formatCurrency(salesMetrics.averageTicket)}
                            </Typography>
                          </Grid>
                          {salesMetrics.pendingSales > 0 && (
                            <Grid item xs={12} sx={{ mt: 1 }}>
                              <Alert severity="warning" icon={<TrendingDownIcon />}>
                                {salesMetrics.pendingSales} ventas pendientes
                              </Alert>
                            </Grid>
                          )}
                        </Grid>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                          <Link to="/dashboard/sales/reports" style={{ textDecoration: 'none' }}>
                            <ModuleButton variant="contained">
                              Ver Reportes de Ventas
                            </ModuleButton>
                          </Link>
                        </Box>
                      </CardContent>
                    </DashboardCard>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <DashboardCard>
                      <CardHeader title="Productos Más Vendidos" />
                      <Divider />
                      <CardContent sx={{ pb: 0 }}>
                        <List>
                          {topProducts.map((product, index) => (
                            <ListItem
                              key={index}
                              sx={{ 
                                py: 1, 
                                backgroundColor: index % 2 === 0 ? '#f8f8f8' : 'transparent',
                                borderRadius: '4px'
                              }}
                            >
                              <ListItemText
                                primary={product.name}
                                primaryTypographyProps={{ fontWeight: 500 }}
                              />
                              <Chip 
                                size="small" 
                                color="primary" 
                                label={`${product.quantity} unidades`}
                                sx={{ bgcolor: '#3D365C' }}
                              />
                            </ListItem>
                          ))}
                          {topProducts.length === 0 && (
                            <ListItem>
                              <ListItemText primary="No hay datos de ventas disponibles" />
                            </ListItem>
                          )}
                        </List>
                      </CardContent>
                    </DashboardCard>
                  </Grid>
                </Grid>

                {/* Sección 3: Ventas Recientes */}
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <DashboardCard>
                      <CardHeader 
                        title="Ventas Recientes" 
                        action={
                          <Link to="/dashboard/sales/list" style={{ textDecoration: 'none' }}>
                            <Button size="small">Ver Todas</Button>
                          </Link>
                        }
                      />
                      <Divider />
                      <TableContainer>
                        {recentSales.length > 0 ? (
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Monto</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {recentSales.map((sale) => (
                                <TableRow key={sale.id} hover>
                                  <TableCell>{sale.client.name}</TableCell>
                                  <TableCell align="right">{formatCurrency(sale.total)}</TableCell>
                                  <TableCell align="center">
                                    <Chip
                                      size="small"
                                      label={
                                        sale.status === 'completed' ? 'Completada' : 
                                        sale.status === 'pending' ? 'Pendiente' : 'Cancelada'
                                      }
                                      color={
                                        sale.status === 'completed' ? 'success' :
                                        sale.status === 'pending' ? 'warning' : 'error'
                                      }
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    {new Date(sale.date).toLocaleDateString('es-CO')}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                              No hay ventas recientes
                            </Typography>
                          </Box>
                        )}
                      </TableContainer>
                    </DashboardCard>
                  </Grid>
                </Grid>

                {/* Accesos rápidos a módulos */}
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Link to="/dashboard/sales/new" style={{ textDecoration: 'none' }}>
                    <ModuleButton variant="contained" startIcon={<PointOfSaleIcon />}>
                      Nueva Venta
                    </ModuleButton>
                  </Link>
                  <Link to="/dashboard/clients/new" style={{ textDecoration: 'none' }}>
                    <ModuleButton variant="contained" startIcon={<PeopleAltIcon />}>
                      Nuevo Cliente
                    </ModuleButton>
                  </Link>
                  <Link to="/dashboard/inventory" style={{ textDecoration: 'none' }}>
                    <ModuleButton variant="contained" startIcon={<InventoryIcon />}>
                      Inventario
                    </ModuleButton>
                  </Link>
                </Box>
              </Box>
            )}
          </Box>
        } />
        <Route path="clients/*" element={<ClientsPage />} />
        <Route path="employees/*" element={<EmployeesPage />} />
        <Route path="inventory/*" element={<InventoryPage />} />
        <Route path="sales/*" element={<SalesPage />} />
      </Routes>
    </Box>
  );
};

export default Dashboard;
