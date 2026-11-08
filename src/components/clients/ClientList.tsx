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
import InvoiceDialog from '../invoice/InvoiceDialog';
import { computeClientStats, ClientStats } from './clientStats';
import clientsService, { Client, CreateClientData } from '../../services/clients.service';
import salesService, { Sale } from '../../services/sales.service';
import { useLoad } from '../../hooks/useLoad';
import { useUI } from '../../contexts/UIContext';
import { formatCurrency, formatDate, initials } from '../../utils/format';
import { docLabel, formatDocument, formatPhone } from '../../utils/validation';
import { matches } from '../../utils/text';
import { downloadCsv } from '../../utils/csv';

type Filter = 'active' | 'inactive' | 'all';

const ClientList: React.FC = () => {
  const { notify, confirm } = useUI();
  const state = useLoad(async () => {
    const [clients, sales] = await Promise.all([clientsService.getAll(), salesService.getAll()]);
    return { clients, sales };
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('active');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [invoice, setInvoice] = useState<Sale | null>(null);

  const stats = useMemo(() => computeClientStats(state.data?.sales || []), [state.data]);
  const counts = useMemo(() => {
    const all = state.data?.clients || [];
    return { all: all.length, active: all.filter((c) => c.status).length, inactive: all.filter((c) => !c.status).length };
  }, [state.data]);

  const rows = useMemo(
    () =>
      (state.data?.clients || []).filter(
        (c) =>
          (filter === 'all' || (filter === 'active' ? c.status : !c.status)) &&
          matches(search, c.name, c.email, c.document, c.phone, c.city)
      ),
    [state.data, search, filter]
  );

  const st = (c: Client): ClientStats | undefined => stats.get(c.id);

  const columns: Column<Client>[] = [
    {
      key: 'name',
      label: 'Cliente',
      sortValue: (c) => c.name,
      render: (c) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, opacity: c.status ? 1 : 0.55 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 800, bgcolor: 'surface.raised', color: 'text.primary' }}>{initials(c.name)}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {c.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {c.email || (c.personType === 'juridica' ? 'Empresa' : 'Persona natural')}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      key: 'document',
      label: 'Documento',
      sortValue: (c) => c.document,
      render: (c) => (
        <Typography variant="body2" noWrap>
          <Typography component="span" variant="caption" color="text.secondary" sx={{ mr: 0.75 }}>
            {docLabel(c.documentType)}
          </Typography>
          {formatDocument(c.documentType, c.document, c.checkDigit)}
        </Typography>
      ),
      hideBelow: 'md'
    },
    { key: 'phone', label: 'Teléfono', render: (c) => formatPhone(c.phone), hideBelow: 'lg' },
    { key: 'count', label: 'Compras', align: 'right', sortValue: (c) => st(c)?.count || 0, render: (c) => st(c)?.count || 0 },
    { key: 'spent', label: 'Total comprado', align: 'right', sortValue: (c) => st(c)?.spent || 0, render: (c) => formatCurrency(st(c)?.spent || 0) },
    { key: 'last', label: 'Última compra', sortValue: (c) => st(c)?.last || '', render: (c) => formatDate(st(c)?.last), hideBelow: 'md' },
    { key: 'status', label: 'Estado', render: (c) => <StatusChip label={c.status ? 'Activo' : 'Inactivo'} tone={c.status ? 'ok' : 'neutral'} /> }
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

  const toggleStatus = async (c: Client) => {
    if (c.status) {
      const ok = await confirm({
        title: `¿Desactivar a ${c.name}?`,
        message: 'No aparecerá al crear ventas. Su historial y sus facturas se conservan, y puedes activarlo de nuevo cuando quieras.',
        confirmLabel: 'Desactivar cliente'
      });
      if (!ok) return;
    }
    try {
      const updated = await clientsService.setStatus(c.id, !c.status);
      setSelected(updated);
      notify(updated.status ? 'Cliente activado' : 'Cliente desactivado');
      state.reload();
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };

  const exportCsv = () =>
    downloadCsv(
      'clientes-battiolab.csv',
      ['Nombre', 'Tipo documento', 'Documento', 'Correo', 'Teléfono', 'Dirección', 'Ciudad', 'Estado', 'Compras', 'Total comprado', 'Última compra'],
      rows.map((c) => [
        c.name,
        docLabel(c.documentType),
        formatDocument(c.documentType, c.document, c.checkDigit),
        c.email,
        c.phone,
        c.address,
        c.city,
        c.status ? 'Activo' : 'Inactivo',
        st(c)?.count || 0,
        st(c)?.spent || 0,
        st(c)?.last?.slice(0, 10) || ''
      ])
    );

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Personas y empresas que compran o llevan sus vehículos al taller."
        actions={
          <>
            <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} disabled={!rows.length}>
              Exportar
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
              Nuevo cliente
            </Button>
          </>
        }
      />
      <LoadGate state={state}>
        {(data) => (
          <Surface padding={0}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2.5, alignItems: { sm: 'center' } }}>
              <SearchField value={search} onChange={setSearch} placeholder="Buscar por nombre, documento, correo o ciudad" maxWidth={420} />
              <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)} aria-label="Filtrar por estado">
                <ToggleButton value="active">Activos {counts.active}</ToggleButton>
                <ToggleButton value="inactive">Inactivos {counts.inactive}</ToggleButton>
                <ToggleButton value="all">Todos {counts.all}</ToggleButton>
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
                    text="Registra tu primer cliente para facturarle y ver su historial."
                    action={
                      <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
                        Nuevo cliente
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState title="Ningún cliente coincide" text="Prueba con otro término o cambia el filtro de estado." />
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
        onToggleStatus={toggleStatus}
        onOpenInvoice={setInvoice}
      />
      <InvoiceDialog sale={invoice} onClose={() => setInvoice(null)} />
    </>
  );
};

export default ClientList;
