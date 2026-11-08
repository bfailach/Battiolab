import React, { useMemo, useState } from 'react';
import { Box, Button, ButtonBase, Tab, Tabs, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { EmptyState, LoadGate, PageHeader } from '../shared/Page';
import SearchField from '../shared/SearchField';
import { StockMeter } from '../shared/ChargeMeter';
import ProductThumb from './ProductThumb';
import { NO_CATEGORIES, NO_PRODUCTS, useInventoryData } from './useInventoryData';
import { useProductActions } from './useProductActions';
import { formatCurrency } from '../../utils/format';

/** Vista de vitrina: los productos como los ve el asesor comercial frente al cliente. */
const ProductCatalog: React.FC = () => {
  const state = useInventoryData();
  const products = state.data?.products ?? NO_PRODUCTS;
  const threshold = state.data?.settings.lowStockThreshold ?? 5;
  const actions = useProductActions({ products, categories: state.data?.categories ?? NO_CATEGORIES, threshold, reload: state.reload });
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => p.status !== 'discontinued')
      .filter((p) => (tab === 'all' || p.category === tab) && (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)));
  }, [products, tab, search]);

  return (
    <>
      <PageHeader
        title="Catálogo"
        description="Vehículos, baterías y repuestos a la venta, con su precio y disponibilidad."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={actions.openNew}>
            Nuevo producto
          </Button>
        }
      />
      <LoadGate state={state}>
        {(data) => (
          <>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
                <Tab value="all" label={`Todo (${products.filter((p) => p.status !== 'discontinued').length})`} />
                {data.categories.map((c) => (
                  <Tab key={c} value={c} label={c} />
                ))}
              </Tabs>
              <Box sx={{ pb: { xs: 2, md: 1 } }}>
                <SearchField value={search} onChange={setSearch} placeholder="Buscar en el catálogo" maxWidth={280} />
              </Box>
            </Box>
            {visible.length === 0 ? (
              <EmptyState title="Nada para mostrar aquí" text="Crea un producto en esta categoría o cambia la búsqueda." />
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2.5 }}>
                {visible.map((p) => (
                  <ButtonBase
                    key={p.id}
                    onClick={() => actions.openDetails(p)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      textAlign: 'left',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      overflow: 'hidden',
                      transition: 'border-color 150ms',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                  >
                    <ProductThumb imageUrl={p.imageUrl} category={p.category} size="100%" height={150} radius={0} />
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {p.category}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ lineHeight: 1.3 }}>
                        {p.name}
                      </Typography>
                      <Typography variant="h4" component="p" sx={{ mt: 0.5 }}>
                        {formatCurrency(p.price)}
                      </Typography>
                      <Box sx={{ mt: 'auto', pt: 1.5 }}>
                        <StockMeter stock={p.stock} minStock={p.minStock} threshold={threshold} width={88} />
                      </Box>
                    </Box>
                  </ButtonBase>
                ))}
              </Box>
            )}
          </>
        )}
      </LoadGate>
      {actions.dialogs}
    </>
  );
};

export default ProductCatalog;
