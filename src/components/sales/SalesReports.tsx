import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import salesService, { Sale } from '../../services/sales.service';
// Using simplified visualization without recharts

// Estilos personalizados
const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: 8,
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const StatNumber = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  color: '#3D365C',
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  color: '#6B6B6B',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 600,
  color: '#303030',
  marginBottom: 16,
}));

// Función para formatear moneda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const SalesReports = () => {
  const theme = useTheme();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week' | 'day'>('month');

  // Cargar datos de ventas
  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true);
        const data = await salesService.getAll();
        setSales(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos de ventas');
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, []);

  // Filtrar ventas por rango de tiempo seleccionado
  const getFilteredSales = () => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return sales;
    }

    return sales.filter(sale => new Date(sale.date) >= startDate);
  };

  const filteredSales = getFilteredSales();

  // Calcular estadísticas
  const calculateStats = () => {
    if (filteredSales.length === 0) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        averageTicket: 0,
        completedSales: 0,
        pendingSales: 0,
        topProduct: { name: 'N/A', quantity: 0 },
        topClient: { name: 'N/A', purchases: 0, total: 0 }
      };
    }

    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const averageTicket = totalRevenue / totalSales;
    const completedSales = filteredSales.filter(sale => sale.status === 'completed').length;
    const pendingSales = filteredSales.filter(sale => sale.status === 'pending').length;

    // Encontrar producto más vendido
    const productSales: Record<string, { name: string, quantity: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName || 'Producto', quantity: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
      });
    });

    let topProduct = { name: 'N/A', quantity: 0 };
    Object.values(productSales).forEach(product => {
      if (product.quantity > topProduct.quantity) {
        topProduct = product;
      }
    });

    // Encontrar cliente con más compras
    const clientSales: Record<string, { name: string, purchases: number, total: number }> = {};
    filteredSales.forEach(sale => {
      const clientId = sale.client.id;
      if (!clientSales[clientId]) {
        clientSales[clientId] = { name: sale.client.name, purchases: 0, total: 0 };
      }
      clientSales[clientId].purchases += 1;
      clientSales[clientId].total += sale.total;
    });

    let topClient = { name: 'N/A', purchases: 0, total: 0 };
    Object.values(clientSales).forEach(client => {
      if (client.purchases > topClient.purchases) {
        topClient = client;
      }
    });

    return { totalSales, totalRevenue, averageTicket, completedSales, pendingSales, topProduct, topClient };
  };

  const stats = calculateStats();

  // Preparar datos para gráficas
  const prepareSalesStatusData = () => {
    return [
      { name: 'Completadas', value: stats.completedSales },
      { name: 'Pendientes', value: stats.pendingSales },
    ];
  };

  const prepareSalesByDayData = () => {
    const days = new Map();
    
    // Obtener ventas de los últimos 7 días
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    // Inicializar todos los días con 0 ventas
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dayName = date.toLocaleDateString('es-CO', { weekday: 'short' });
      days.set(dayName, 0);
    }
    
    // Contar ventas por día
    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.date);
      if (saleDate >= weekAgo) {
        const dayName = saleDate.toLocaleDateString('es-CO', { weekday: 'short' });
        days.set(dayName, (days.get(dayName) || 0) + sale.total);
      }
    });
    
    // Convertir a array para la gráfica
    return Array.from(days.entries()).map(([day, total]) => ({
      day,
      total
    })).reverse();
  };

  // Colors for the pie chart
  const COLORS = ['#4CAF50', '#FFC107', '#F44336'];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#303030', fontWeight: 700 }}>
          Reportes de Ventas
        </Typography>
        
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Periodo</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'all' | 'month' | 'week' | 'day')}
            label="Periodo"
            sx={{ backgroundColor: 'white' }}
          >
            <MenuItem value="all">Todo el tiempo</MenuItem>
            <MenuItem value="month">Último mes</MenuItem>
            <MenuItem value="week">Última semana</MenuItem>
            <MenuItem value="day">Último día</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Métricas principales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent>
                  <StatLabel>Total de Ventas</StatLabel>
                  <StatNumber>{stats.totalSales}</StatNumber>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent>
                  <StatLabel>Ingresos Totales</StatLabel>
                  <StatNumber>{formatCurrency(stats.totalRevenue)}</StatNumber>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent>
                  <StatLabel>Ticket Promedio</StatLabel>
                  <StatNumber>{formatCurrency(stats.averageTicket)}</StatNumber>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent>
                  <StatLabel>Completadas</StatLabel>
                  <StatNumber>{stats.completedSales} de {stats.totalSales}</StatNumber>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>

          {/* Mejores desempeños */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <StyledCard>
                <CardContent>
                  <SectionTitle>Producto Más Vendido</SectionTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">{stats.topProduct.name}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {stats.topProduct.quantity} unidades
                    </Typography>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledCard>
                <CardContent>
                  <SectionTitle>Cliente con Más Compras</SectionTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">{stats.topClient.name}</Typography>
                    <Box>
                      <Typography variant="body1" sx={{ textAlign: 'right' }}>
                        {stats.topClient.purchases} compras
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'right' }}>
                        {formatCurrency(stats.topClient.total)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>

          {/* Visualización simplificada */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <StyledCard>
                <CardContent>
                  <SectionTitle>Ventas por Día</SectionTitle>
                  <Box sx={{ height: 300, display: 'flex', flexDirection: 'column' }}>
                    {prepareSalesByDayData().map((data, index) => (
                      <Box key={`day-${index}`} sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
                        <Typography sx={{ width: 80 }}>{data.day}:</Typography>
                        <Box sx={{ 
                          flex: 1, 
                          height: 24, 
                          backgroundColor: '#3D365C',
                          maxWidth: `${(data.total / stats.totalRevenue) * 100}%`,
                          minWidth: '5%',
                          borderRadius: 1
                        }} />
                        <Typography sx={{ ml: 2 }}>{formatCurrency(data.total)}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <StyledCard>
                <CardContent>
                  <SectionTitle>Estado de Ventas</SectionTitle>
                  <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {prepareSalesStatusData().map((status, index) => (
                      <Box key={`status-${index}`} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                          }}>
                            <Box 
                              component="span" 
                              sx={{ 
                                display: 'inline-block',
                                width: 16, 
                                height: 16, 
                                backgroundColor: COLORS[index], 
                                mr: 1,
                                borderRadius: '50%'
                              }}
                            />
                            {status.name}
                          </Typography>
                          <Typography>{status.value}</Typography>
                        </Box>
                        <Box sx={{ 
                          width: '100%', 
                          height: 8, 
                          backgroundColor: '#e0e0e0',
                          borderRadius: 1
                        }}>
                          <Box sx={{ 
                            height: '100%', 
                            width: `${(status.value / stats.totalSales) * 100}%`,
                            backgroundColor: COLORS[index],
                            borderRadius: 1
                          }}/>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default SalesReports;
