import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, ButtonBase, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { EmptyState, LoadGate, PageHeader, Surface } from '../shared/Page';
import DataTable, { Column } from '../shared/DataTable';
import { computeClientStats, Segment, segmentClients, segmentInfo } from './clientStats';
import clientsService, { Client } from '../../services/clients.service';
import salesService from '../../services/sales.service';
import { useLoad } from '../../hooks/useLoad';
import { formatCurrency, formatDate } from '../../utils/format';
import { brand } from '../../theme';

const ORDER: Segment[] = ['vip', 'frequent', 'new', 'dormant', 'never'];

const ClientGroups: React.FC = () => {
  const navigate = useNavigate();
  const state = useLoad(async () => {
    const [clients, sales] = await Promise.all([clientsService.getAll(), salesService.getAll()]);
    return { clients, sales };
  });
  const [segment, setSegment] = useState<Segment>('vip');

  const computed = useMemo(() => {
    if (!state.data) return null;
    const stats = computeClientStats(state.data.sales);
    return { stats, groups: segmentClients(state.data.clients, stats) };
  }, [state.data]);

  const columns: Column<Client>[] = [
    { key: 'name', label: 'Cliente', sortValue: (c) => c.name, render: (c) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography> },
    { key: 'email', label: 'Correo', render: (c) => c.email, hideBelow: 'md' },
    { key: 'count', label: 'Compras', align: 'right', sortValue: (c) => computed?.stats.get(c.id)?.count || 0, render: (c) => computed?.stats.get(c.id)?.count || 0 },
    {
      key: 'spent',
      label: 'Total comprado',
      align: 'right',
      sortValue: (c) => computed?.stats.get(c.id)?.spent || 0,
      render: (c) => formatCurrency(computed?.stats.get(c.id)?.spent || 0)
    },
    { key: 'last', label: 'Última compra', sortValue: (c) => computed?.stats.get(c.id)?.last || '', render: (c) => formatDate(computed?.stats.get(c.id)?.last) }
  ];

  return (
    <>
      <PageHeader title="Grupos de clientes" description="Segmentos calculados con el historial de compras, para decidir a quién contactar." />
      <LoadGate state={state}>
        {() =>
          computed && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '280px 1fr' }, gap: 3, alignItems: 'start' }}>
              <Box role="tablist" aria-label="Segmentos" sx={{ display: 'flex', flexDirection: { xs: 'row', lg: 'column' }, gap: 1, overflowX: 'auto' }}>
                {ORDER.map((s) => {
                  const active = s === segment;
                  return (
                    <ButtonBase
                      key={s}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSegment(s)}
                      sx={(t) => ({
                        flexShrink: 0,
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        gap: 2,
                        p: 1.75,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: active ? brand.magenta : 'divider',
                        bgcolor: active ? alpha(brand.magenta, t.palette.mode === 'dark' ? 0.16 : 0.06) : 'background.paper',
                        minWidth: { xs: 200, lg: 0 }
                      })}
                    >
                      <Box>
                        <Typography variant="subtitle1">{segmentInfo[s].label}</Typography>
                        <Typography variant="caption" color="text.secondary" component="div">
                          {segmentInfo[s].description}
                        </Typography>
                      </Box>
                      <Typography variant="h4" component="span">
                        {computed.groups[s].length}
                      </Typography>
                    </ButtonBase>
                  );
                })}
              </Box>
              <Surface title={segmentInfo[segment].label} subtitle={segmentInfo[segment].description} padding={0}>
                <DataTable
                  rows={computed.groups[segment]}
                  columns={columns}
                  rowKey={(c) => c.id}
                  onRowClick={(c) => navigate(`/dashboard/clients/history?client=${c.id}`)}
                  initialSort={{ key: 'spent', dir: 'desc' }}
                  empty={<EmptyState title="Nadie en este grupo por ahora" text="El grupo se actualiza solo a medida que se registran ventas." />}
                />
              </Surface>
            </Box>
          )
        }
      </LoadGate>
    </>
  );
};

export default ClientGroups;
