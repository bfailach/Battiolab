import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
  Chip,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import clientsService from '../../services/clients.service';
import salesService, { Sale } from '../../services/sales.service';

// Estilos personalizados
const StyledCard = styled(Card)({
  backgroundColor: 'white',
  borderRadius: 8,
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});

const SectionTitle = styled(Typography)({
  fontSize: '1.5rem',
  fontWeight: 600,
  color: '#303030',
  marginBottom: 16,
});

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

// Interfaces para los datos
interface ClientData {
  id: string;
  _id?: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientWithPurchases extends ClientData {
  totalPurchases: number;
  totalSpent: number;
  preferredProducts: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  lastPurchase: string;
}

interface ProductStat {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface ClientGroup {
  name: string;
  clients: ClientWithPurchases[];
  description: string;
}

// Componente principal
const ClientGroups: React.FC = () => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [clientsWithPurchases, setClientsWithPurchases] = useState<ClientWithPurchases[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);

  // Cargar datos de clientes y ventas
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Obtenemos datos crudos de clientes
        const rawClients = await clientsService.getAll();
        // Aseguramos que cada cliente tenga un id string
        const clientsData: ClientData[] = rawClients.map(c => ({
          ...(c as any),
          id: c.id ?? c._id!,
        }));
        const salesData = await salesService.getAll();

        setClients(clientsData);
        setSales(salesData);
        // Procesar datos de clientes con sus compras
        processClientPurchases(clientsData, salesData);
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Procesar compras de clientes y estadísticas de productos
  const processClientPurchases = (
    clientsData: ClientData[],
    salesData: Sale[]
  ) => {
    const clientStats = new Map<
      string,
      {
        totalPurchases: number;
        totalSpent: number;
        lastPurchase: string;
        products: Map<
          string,
          {
            productId: string;
            productName: string;
            quantity: number;
          }
        >;
      }
    >();

    clientsData.forEach(client => {
      clientStats.set(client.id, {
        totalPurchases: 0,
        totalSpent: 0,
        lastPurchase: '',
        products: new Map(),
      });
    });

    const productStats = new Map<
      string,
      {
        id: string;
        name: string;
        quantity: number;
        revenue: number;
      }
    >();

    salesData.forEach(sale => {
      const clientId = sale.client.id;
      const clientStat = clientStats.get(clientId);
      if (!clientStat) return;

      clientStat.totalPurchases++;
      clientStat.totalSpent += sale.total;

      const saleDate = new Date(sale.date);
      const lastPurchaseDate = clientStat.lastPurchase
        ? new Date(clientStat.lastPurchase)
        : new Date(0);
      if (saleDate > lastPurchaseDate) {
        clientStat.lastPurchase = sale.date;
      }

      sale.items.forEach(item => {
        const { productId, productName = 'Producto', quantity, price } = item;
        if (!clientStat.products.has(productId)) {
          clientStat.products.set(productId, { productId, productName, quantity });
        } else {
          const curr = clientStat.products.get(productId)!;
          curr.quantity += quantity;
        }

        if (!productStats.has(productId)) {
          productStats.set(productId, {
            id: productId,
            name: productName,
            quantity,
            revenue: price * quantity,
          });
        } else {
          const curr = productStats.get(productId)!;
          curr.quantity += quantity;
          curr.revenue += price * quantity;
        }
      });
    });

    const processedClients = clientsData
      .map(client => {
        const stats = clientStats.get(client.id)!;
        const preferredProducts = Array.from(stats.products.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 3);
        return {
          ...client,
          totalPurchases: stats.totalPurchases,
          totalSpent: stats.totalSpent,
          preferredProducts,
          lastPurchase: stats.lastPurchase,
        };
      })
      .filter(c => c.totalPurchases > 0);

    setClientsWithPurchases(processedClients);

    const topProductsArray = Array.from(productStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    setTopProducts(topProductsArray);
  };

  // Generar grupos
  const generateClientGroups = (): ClientGroup[] => {
    const active = clientsWithPurchases.filter(c => c.status);
    return [
      {
        name: 'Clientes Premium',
        description: 'Clientes con mayor gasto total',
        clients: [...active]
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 5),
      },
      {
        name: 'Clientes Frecuentes',
        description: 'Clientes con mayor número de compras',
        clients: [...active]
          .sort((a, b) => b.totalPurchases - a.totalPurchases)
          .slice(0, 5),
      },
      {
        name: 'Clientes Recientes',
        description: 'Clientes con compras más recientes',
        clients: [...active]
          .filter(c => c.lastPurchase)
          .sort(
            (a, b) =>
              new Date(b.lastPurchase).getTime() - new Date(a.lastPurchase).getTime()
          )
          .slice(0, 5),
      },
    ];
  };

  const clientGroups = generateClientGroups();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#303030', fontWeight: 700 }}>
        Grupos de Clientes
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : clientsWithPurchases.length === 0 ? (
        <Alert severity="info">No hay datos de compras de clientes disponibles para mostrar estadísticas.</Alert>
      ) : (
        <>
          {/* Métricas generales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StyledCard>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Clientes con Compras
                  </Typography>
                  <StatNumber>
                    {clientsWithPurchases.length} de {clients.length}
                  </StatNumber>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StyledCard>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Promedio de Compras por Cliente
                  </Typography>
                  <StatNumber>
                    {clientsWithPurchases.length > 0
                      ? (clientsWithPurchases.reduce((sum, c) => sum + c.totalPurchases, 0) /
                          clientsWithPurchases.length
                        ).toFixed(1)
                      : '0'}
                  </StatNumber>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StyledCard>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Gasto Promedio por Cliente
                  </Typography>
                  <StatNumber>
                    {clientsWithPurchases.length > 0
                      ? formatCurrency(
                          clientsWithPurchases.reduce((sum, c) => sum + c.totalSpent, 0) /
                            clientsWithPurchases.length
                        )
                      : formatCurrency(0)}
                  </StatNumber>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>

          {/* Pestañas de grupos */}
          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {clientGroups.map((g, i) => (
                <Tab key={i} label={g.name} />
              ))}
            </Tabs>
            <Box sx={{ p: 3 }}>
              {clientGroups.map((g, i) => (
                <Box
                  key={i}
                  role="tabpanel"
                  hidden={tabValue !== i}
                  id={`client-group-tabpanel-${i}`}
                  aria-labelledby={`client-group-tab-${i}`}
                >
                  {tabValue === i && (
                    <>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {g.description}
                      </Typography>
                      {g.clients.length === 0 ? (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          No hay clientes en este grupo.
                        </Alert>
                      ) : (
                        <Grid container spacing={3}>
                          {g.clients.map(client => (
                            <Grid item xs={12} md={6} key={client.id}>
                              <StyledCard>
                                <CardContent>
                                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                    {client.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {client.email} • {client.phone}
                                  </Typography>
                                  <Divider sx={{ my: 2 }} />
                                  <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Compras Totales
                                      </Typography>
                                      <Typography variant="body1" fontWeight={600}>
                                        {client.totalPurchases}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Gasto Total
                                      </Typography>
                                      <Typography variant="body1" fontWeight={600}>
                                        {formatCurrency(client.totalSpent)}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Typography variant="body2" color="text.secondary">
                                        Última Compra
                                      </Typography>
                                      <Typography variant="body1" fontWeight={600}>
                                        {client.lastPurchase
                                          ? new Date(client.lastPurchase).toLocaleDateString('es-CO', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                            })
                                          : 'N/A'}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Productos Preferidos
                                      </Typography>
                                      {client.preferredProducts.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                          {client.preferredProducts.map(p => (
                                            <Chip
                                              key={p.productId}
                                              label={`${p.productName} (${p.quantity})`}
                                              size="small"
                                              sx={{ bgcolor: '#F8B55F' }}
                                            />
                                          ))}
                                        </Box>
                                      ) : (
                                        <Typography variant="body2">No hay productos preferidos</Typography>
                                      )}
                                    </Grid>
                                  </Grid>
                                </CardContent>
                              </StyledCard>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </>
                  )}
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Productos más vendidos */}
          <SectionTitle>Productos Más Vendidos</SectionTitle>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {topProducts.slice(0, 6).map(product => (
                <Grid item xs={12} md={4} key={product.id}>
                  <Card sx={{ bgcolor: '#F8F8F8', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {product.quantity} unidades vendidas
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="#3D365C">
                        {formatCurrency(product.revenue)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ClientGroups;
