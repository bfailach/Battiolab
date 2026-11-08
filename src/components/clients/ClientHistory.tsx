import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Autocomplete, Box, Button, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import { EmptyState, LoadGate, PageHeader, StatStrip, Surface } from '../shared/Page';
import StatusChip, { saleTone } from '../shared/StatusChip';
import clientsService, { Client } from '../../services/clients.service';
import salesService, { Sale, saleStatusLabel } from '../../services/sales.service';
import { useLoad } from '../../hooks/useLoad';
import { formatCurrency, formatDate } from '../../utils/format';
import { computeClientStats } from './clientStats';
import { brand } from '../../theme';

/** Línea de tiempo de compras: cada venta con sus productos. */
const Timeline: React.FC<{ sales: Sale[]; showClient?: boolean }> = ({ sales, showClient }) => (
  <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
    {sales.map((s, i) => (
      <Box component="li" key={s.id} sx={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              mt: 0.75,
              borderRadius: '3px',
              bgcolor: s.status === 'cancelled' ? 'action.disabled' : s.status === 'pending' ? brand.charge : brand.magenta
            }}
          />
          {i < sales.length - 1 && <Box sx={{ flex: 1, width: '2px', bgcolor: 'divider', my: 0.5 }} />}
        </Box>
        <Box sx={{ pb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="subtitle1">
                {showClient ? s.client.name : formatDate(s.date)}
                {s.number && (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {s.number}
                  </Typography>
                )}
              </Typography>
              {showClient && (
                <Typography variant="caption" color="text.secondary">
                  {formatDate(s.date)}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <StatusChip label={saleStatusLabel[s.status]} tone={saleTone[s.status]} />
              <Typography sx={{ fontWeight: 700, textDecoration: s.status === 'cancelled' ? 'line-through' : 'none' }}>
                {formatCurrency(s.total)}
              </Typography>
            </Stack>
          </Box>
          <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.25, color: 'text.secondary' }}>
            {s.items.map((it) => (
              <Typography component="li" variant="body2" key={it.productId + it.price}>
                {it.quantity} × {it.productName} ({formatCurrency(it.price)})
              </Typography>
            ))}
          </Box>
          {s.paymentMethod && (
            <Typography variant="caption" color="text.secondary">
              Pago: {s.paymentMethod}
            </Typography>
          )}
        </Box>
      </Box>
    ))}
  </Box>
);

const ClientHistory: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const clientId = params.get('client');
  const state = useLoad(async () => {
    const [clients, sales] = await Promise.all([clientsService.getAll(), salesService.getAll()]);
    return { clients, sales };
  });

  const selected = state.data?.clients.find((c) => c.id === clientId) || null;
  const own = useMemo(() => (state.data && selected ? state.data.sales.filter((s) => s.client.id === selected.id) : []), [state.data, selected]);
  const st = useMemo(() => (selected ? computeClientStats(own).get(selected.id) : undefined), [own, selected]);
  const topProducts = st ? [...st.products.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5) : [];

  return (
    <>
      <PageHeader
        title="Historial de compras"
        description="Elige un cliente para ver todo lo que ha comprado, o revisa los movimientos recientes de todos."
        actions={
          selected && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`/dashboard/sales/new?client=${selected.id}`)}>
              Vender a {selected.name.split(' ')[0]}
            </Button>
          )
        }
      />
      <LoadGate state={state}>
        {(data) => (
          <>
            <Autocomplete<Client>
              options={data.clients}
              value={selected}
              onChange={(_, c) => setParams(c ? { client: c.id } : {})}
              getOptionLabel={(c) => `${c.name} (${c.document})`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(p) => <TextField {...p} label="Cliente" placeholder="Busca por nombre o documento" />}
              sx={{ maxWidth: 480, mb: 3 }}
              noOptionsText="Ningún cliente coincide"
            />

            {selected ? (
              <>
                <StatStrip
                  stats={[
                    { label: 'Compras', value: st?.count || 0 },
                    { label: 'Total comprado', value: formatCurrency(st?.spent || 0) },
                    { label: 'Ticket promedio', value: formatCurrency(st?.count ? st.spent / st.count : 0) },
                    { label: 'Cliente desde', value: formatDate(selected.createdAt), hint: st?.last ? `Última compra: ${formatDate(st.last)}` : 'Sin compras' }
                  ]}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 320px' }, gap: 3, alignItems: 'start' }}>
                  <Surface title="Compras">
                    {own.length ? (
                      <Timeline sales={own} />
                    ) : (
                      <EmptyState
                        icon={<ReceiptLongOutlinedIcon />}
                        title="Sin compras registradas"
                        text="Cuando le vendas algo a este cliente aparecerá aquí."
                      />
                    )}
                  </Surface>
                  <Surface title="Lo que más compra">
                    {topProducts.length ? (
                      <Stack spacing={1.25}>
                        {topProducts.map((p) => (
                          <Box key={p.name} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                            <Typography variant="body2">{p.name}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {p.quantity} u.
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Aún no hay datos.
                      </Typography>
                    )}
                  </Surface>
                </Box>
              </>
            ) : (
              <Surface title="Compras recientes de todos los clientes">
                {data.sales.length ? (
                  <Timeline sales={data.sales.slice(0, 10)} showClient />
                ) : (
                  <EmptyState icon={<ReceiptLongOutlinedIcon />} title="Todavía no hay ventas" text="Registra una venta para empezar el historial." />
                )}
              </Surface>
            )}
          </>
        )}
      </LoadGate>
    </>
  );
};

export default ClientHistory;
