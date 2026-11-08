import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonBase, Stack, Typography } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { EmptyState, LoadGate, PageHeader, Surface } from '../shared/Page';
import DataTable, { Column } from '../shared/DataTable';
import ChargeMeter from '../shared/ChargeMeter';
import { computeClientStats, Segment, segmentClients, segmentInfo } from './clientStats';
import clientsService, { Client } from '../../services/clients.service';
import salesService from '../../services/sales.service';
import { useLoad } from '../../hooks/useLoad';
import { useUI } from '../../contexts/UIContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { formatPhone } from '../../utils/validation';
import { downloadCsv } from '../../utils/csv';
import { wide } from '../../theme';

const ORDER: Segment[] = ['vip', 'frequent', 'new', 'dormant', 'never'];

const ClientGroups: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useUI();
  const state = useLoad(async () => {
    const [clients, sales] = await Promise.all([clientsService.getAll(), salesService.getAll()]);
    return { clients: clients.filter((c) => c.status), sales };
  });
  const [segment, setSegment] = useState<Segment>('vip');

  const computed = useMemo(() => {
    if (!state.data) return null;
    const stats = computeClientStats(state.data.sales);
    const revenue = [...stats.values()].reduce((s, x) => s + x.spent, 0);
    return { stats, revenue, groups: segmentClients(state.data.clients, stats) };
  }, [state.data]);

  const members = computed?.groups[segment] || [];
  const segmentRevenue = members.reduce((s, c) => s + (computed?.stats.get(c.id)?.spent || 0), 0);
  const share = computed?.revenue ? segmentRevenue / computed.revenue : 0;
  const stat = (c: Client) => computed?.stats.get(c.id);

  const columns: Column<Client>[] = [
    { key: 'name', label: 'Cliente', sortValue: (c) => c.name, render: (c) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.name}</Typography> },
    { key: 'contact', label: 'Contacto', render: (c) => <Typography variant="body2" color="text.secondary">{c.email || formatPhone(c.phone)}</Typography>, hideBelow: 'md' },
    { key: 'count', label: 'Compras', align: 'right', sortValue: (c) => stat(c)?.count || 0, render: (c) => stat(c)?.count || 0 },
    { key: 'spent', label: 'Total comprado', align: 'right', sortValue: (c) => stat(c)?.spent || 0, render: (c) => formatCurrency(stat(c)?.spent || 0) },
    { key: 'last', label: 'Última compra', sortValue: (c) => stat(c)?.last || '', render: (c) => formatDate(stat(c)?.last), hideBelow: 'sm' }
  ];

  const emails = members.map((c) => c.email).filter(Boolean) as string[];

  return (
    <>
      <PageHeader title="Grupos de clientes" description="Segmentos calculados con el historial de compras, para decidir a quién llamar o escribir. Solo incluye clientes activos." />
      <LoadGate state={state}>
        {() =>
          computed && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '300px 1fr' }, gap: 3, alignItems: 'start' }}>
              <Box
                role="tablist"
                aria-label="Segmentos"
                aria-orientation="vertical"
                sx={{
                  position: { lg: 'sticky' },
                  top: { lg: 92 },
                  display: 'flex',
                  flexDirection: { xs: 'row', lg: 'column' },
                  gap: 0.75,
                  overflowX: { xs: 'auto', lg: 'visible' },
                  pb: { xs: 1, lg: 0 }
                }}
              >
                {ORDER.map((s) => {
                  const active = s === segment;
                  const count = computed.groups[s].length;
                  return (
                    <ButtonBase
                      key={s}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSegment(s)}
                      sx={(t) => ({
                        flexShrink: 0,
                        minWidth: { xs: 220, lg: 0 },
                        display: 'grid',
                        gridTemplateColumns: '56px 1fr',
                        alignItems: 'center',
                        gap: 1.5,
                        textAlign: 'left',
                        px: 2,
                        py: 1.5,
                        borderRadius: 4,
                        bgcolor: active ? t.palette.selected.bg : 'transparent',
                        color: active ? t.palette.selected.text : t.palette.text.primary,
                        transition: 'background-color 120ms',
                        '&:hover': { bgcolor: active ? t.palette.selected.bg : t.palette.action.hover }
                      })}
                    >
                      <Typography component="span" sx={{ ...wide, fontSize: '1.75rem', lineHeight: 1, opacity: count ? 1 : 0.4 }}>
                        {count}
                      </Typography>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem' }}>{segmentInfo[s].label}</Typography>
                        <Typography variant="caption" component="div" sx={{ opacity: 0.7, lineHeight: 1.35 }}>
                          {segmentInfo[s].description}
                        </Typography>
                      </Box>
                    </ButtonBase>
                  );
                })}
              </Box>

              <Surface
                title={segmentInfo[segment].label}
                subtitle={`${members.length} clientes, ${formatCurrency(segmentRevenue)} en compras`}
                padding={0}
                action={
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyOutlinedIcon />}
                      disabled={!emails.length}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(emails.join(', '));
                          notify(`${emails.length} correos copiados`);
                        } catch {
                          notify('No se pudo copiar al portapapeles', 'error');
                        }
                      }}
                    >
                      Copiar correos
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<FileDownloadOutlinedIcon />}
                      disabled={!members.length}
                      onClick={() =>
                        downloadCsv(
                          `grupo-${segment}.csv`,
                          ['Cliente', 'Correo', 'Teléfono', 'Compras', 'Total comprado', 'Última compra'],
                          members.map((c) => [c.name, c.email, c.phone, stat(c)?.count || 0, stat(c)?.spent || 0, stat(c)?.last?.slice(0, 10) || ''])
                        )
                      }
                    >
                      Exportar
                    </Button>
                  </Stack>
                }
              >
                <Box sx={{ px: 3, pb: 2 }}>
                  <ChargeMeter value={share} level="ok" width={240} segments={20} height={12} label={`${Math.round(share * 100)} % de los ingresos`} />
                </Box>
                <DataTable
                  rows={members}
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
