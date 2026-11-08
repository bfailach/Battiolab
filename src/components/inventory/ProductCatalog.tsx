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
import { matches } from '../../utils/text';
import { priceWithTax } from '../../services/products.service';
import { wide } from '../../theme';

/** Vista de vitrina: los productos como los ve el asesor comercial frente al cliente. */
const ProductCatalog: React.FC = () => {
  const state = useInventoryData();
  const products = state.data?.products ?? NO_PRODUCTS;
  const threshold = state.data?.settings.lowStockThreshold ?? 5;
  const actions = useProductActions({ products, categories: state.data?.categories ?? NO_CATEGORIES, threshold, uvt: state.data?.uvt, reload: state.reload });
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => p.status !== 'discontinued')
      .filter((p) => (tab === 'all' || p.category === tab) && matches(q, p.name, p.sku));
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
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
                {visible.map((p) => (
                  <ButtonBase
                    key={p.id}
                    onClick={() => actions.openDetails(p)}
                    aria-label={`${p.name}, ${formatCurrency(priceWithTax(p))}`}
                    sx={{
                      position: 'relative',
                      display: 'block',
                      aspectRatio: '4 / 5',
                      borderRadius: 5,
                      overflow: 'hidden',
                      bgcolor: 'surface.raised',
                      textAlign: 'left',
                      '& img': { transition: 'transform 400ms cubic-bezier(.2,.8,.2,1)' },
                      '&:hover img, &:focus-visible img': { transform: 'scale(1.04)' }
                    }}
                  >
                    <Box sx={{ position: 'absolute', inset: 0 }}>
                      <ProductThumb imageUrl={p.imageUrl} category={p.category} size="100%" height="100%" radius={0} />
                    </Box>
                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(27,23,41,0) 38%, rgba(27,23,41,0.92) 100%)' }} />
                    <Box sx={{ position: 'absolute', top: 14, left: 14, px: 1.25, py: 0.25, borderRadius: 999, bgcolor: 'rgba(61,54,92,0.85)', color: '#fff' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {p.category}
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'absolute', left: 18, right: 18, bottom: 16, color: '#fff' }}>
                      <Typography sx={{ ...wide, fontSize: '1.25rem', lineHeight: 1.1 }}>{p.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1, mt: 1.25 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: '1.0625rem' }}>{formatCurrency(priceWithTax(p))}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                            IVA {p.taxRate} % incluido
                          </Typography>
                        </Box>
                        <Box sx={{ color: '#fff', '& .MuiTypography-root': { color: '#fff' } }}>
                          <StockMeter stock={p.stock} minStock={p.minStock} threshold={threshold} width={64} />
                        </Box>
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
