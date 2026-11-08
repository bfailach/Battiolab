import React, { useMemo, useState } from 'react';
import { Avatar, Box, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { EmptyState, LoadGate, PageHeader, Surface } from '../shared/Page';
import DataTable, { Column } from '../shared/DataTable';
import SearchField from '../shared/SearchField';
import StatusChip from '../shared/StatusChip';
import ClientForm from './ClientForm';
import ClientDetails from './ClientDetails';
import { computeClientStats, ClientStats } from './clientStats';
import clientsService, { Client, CreateClientData } from '../../services/clients.service';
import salesService from '../../services/sales.service';
import { useLoad } from '../../hooks/useLoad';
import { useUI } from '../../contexts/UIContext';
import { formatCurrency, formatDate, initials } from '../../utils/format';
import { downloadCsv } from '../../utils/csv';
import { brand } from '../../theme';

type Filter = 'all' | 'active' | 'inactive';

const ClientList: React.FC = () => {
  const { notify, confirm } = useUI();
  const state = useLoad(async () => {
    const [clients, sales] = await Promise.all([clientsService.getAll(), salesService.getAll()]);
    return { clients, sales };
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);

  const stats = useMemo(() => computeClientStats(state.data?.sales || []), [state.data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (state.data?.clients || []).filter((c) => {
      if (filter === 'active' && !c.status) return false;
      if (filter === 'inactive' && c.status) return false;
      return !q || [c.name, c.email, c.document, c.phone].some((v) => v?.toLowerCase().includes(q));
    });
  }, [state.data, search, filter]);

  const st = (c: Client): ClientStats | undefined => stats.get(c.id);

  const columns: Column<Client>[] = [
    {
      key: 'name',
      label: 'Cliente',
      sortValue: (c) => c.name,
      render: (c) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, bgcolor: c.status ? brand.violet : 'action.disabled' }}>
            {initials(c.name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {c.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {c.email}
            </Typography>
          </Box>
        </Box>
      )
    },
    { key: 'document', label: 'Documento', sortValue: (c) => c.document, render: (c) => c.document, hideBelow: 'md' },
    { key: 'phone', label: 'Teléfono', render: (c) => c.phone, hideBelow: 'lg' },
    { key: 'count', label: 'Compras', align: 'right', sortValue: (c) => st(c)?.count || 0, render: (c) => st(c)?.count || 0 },
    {
      key: 'spent',
      label: 'Total comprado',
      align: 'right',
      sortValue: (c) => st(c)?.spent || 0,
      render: (c) => formatCurrency(st(c)?.spent || 0)
    },
    {
      key: 'last',
      label: 'Última compra',
      sortValue: (c) => st(c)?.last || '',
      render: (c) => formatDate(st(c)?.last),
      hideBelow: 'md'
    },
    {
      key: 'status',
      label: 'Estado',
      render: (c) => <StatusChip label={c.status ? 'Activo' : 'Inactivo'} tone={c.status ? 'ok' : 'neutral'} />
    }
  ];

  const save = async (data: CreateClientData) => {
    if (editing) {
      const updated = await clientsService.update(editing.id, data);
      notify('Cliente actualizado');
      if (selected?.id === updated.id) setSelected(updated);
    } else {
      await clientsService.create(data);
      notify('Cliente creado');
    }
    setFormOpen(false);
    setEditing(null);
    state.reload();
  };

  const remove = async (c: Client) => {
    const ok = await confirm({
      title: `¿Eliminar a ${c.name}?`,
      message: 'Sus ventas se conservan, pero dejarán de estar vinculadas a un cliente existente.',
      confirmLabel: 'Eliminar cliente',
      destructive: true
    });
    if (!ok) return;
    try {
      await clientsService.delete(c.id);
      notify('Cliente eliminado');
      setSelected(null);
      state.reload();
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };

  const exportCsv = () =>
    downloadCsv(
      'clientes-battiolab.csv',
      ['Nombre', 'Documento', 'Correo', 'Teléfono', 'Estado', 'Compras', 'Total comprado', 'Última compra'],
      rows.map((c) => [c.name, c.document, c.email, c.phone, c.status ? 'Activo' : 'Inactivo', st(c)?.count || 0, st(c)?.spent || 0, st(c)?.last?.slice(0, 10) || ''])
    );

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Personas y empresas que compran o llevan sus vehículos al taller."
        actions={
          <>
            <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} disabled={!rows.length}>
              Exportar CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Nuevo cliente
            </Button>
          </>
        }
      />
      <LoadGate state={state}>
        {(data) => (
          <Surface padding={0}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2, alignItems: { sm: 'center' } }}>
              <SearchField value={search} onChange={setSearch} placeholder="Buscar por nombre, correo o documento" />
              <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)} aria-label="Filtrar por estado">
                <ToggleButton value="all">Todos ({data.clients.length})</ToggleButton>
                <ToggleButton value="active">Activos</ToggleButton>
                <ToggleButton value="inactive">Inactivos</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(c) => c.id}
              onRowClick={setSelected}
              initialSort={{ key: 'name', dir: 'asc' }}
              empty={
                data.clients.length === 0 ? (
                  <EmptyState
                    icon={<PeopleAltOutlinedIcon />}
                    title="Todavía no hay clientes"
                    text="Registra tu primer cliente para asociarle ventas y ver su historial."
                    action={
                      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
                        Nuevo cliente
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState title="Ningún cliente coincide" text="Prueba con otro término o quita el filtro de estado." />
                )
              }
            />
          </Surface>
        )}
      </LoadGate>

      <ClientForm
        open={formOpen}
        client={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={save}
      />
      <ClientDetails
        client={selected}
        sales={state.data?.sales || []}
        onClose={() => setSelected(null)}
        onEdit={(c) => {
          setEditing(c);
          setFormOpen(true);
        }}
        onDelete={remove}
      />
    </>
  );
};

export default ClientList;
