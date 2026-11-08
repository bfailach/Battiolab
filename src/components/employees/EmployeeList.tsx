import React, { useMemo, useState } from 'react';
import { Avatar, Box, Button, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { EmptyState, LoadGate, PageHeader, Surface } from '../shared/Page';
import DataTable, { Column } from '../shared/DataTable';
import SearchField from '../shared/SearchField';
import StatusChip from '../shared/StatusChip';
import DetailDrawer, { DetailRow } from '../shared/DetailDrawer';
import EmployeeForm from './EmployeeForm';
import { useEmployeesData } from './useEmployeesData';
import employeesService, { CreateEmployeeData, Employee } from '../../services/employees.service';
import { useUI } from '../../contexts/UIContext';
import { formatCurrency, formatDate, initials, toInputDate, yearsSince } from '../../utils/format';
import { docLabel, formatDocument, formatPhone } from '../../utils/validation';
import { matches } from '../../utils/text';
import FormDialog, { FormGrid, Full } from '../shared/FormDialog';
import { TextField as Field } from '@mui/material';

const tenure = (d: string) => {
  const y = yearsSince(d);
  if (y < 1) return `${Math.max(0, Math.round(y * 12))} meses`;
  return `${y.toFixed(1).replace('.', ',')} años`;
};

const EmployeeList: React.FC = () => {
  const { notify } = useUI();
  const state = useEmployeesData();
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('active');
  const [retiring, setRetiring] = useState<Employee | null>(null);
  const [retire, setRetire] = useState({ date: toInputDate(new Date()), reason: '' });
  const [retireError, setRetireError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (state.data?.employees || []).filter(
      (e) =>
        (dept === 'all' || e.department === dept) &&
        (status === 'all' || (status === 'active' ? e.status : !e.status)) &&
        matches(q, e.name, e.email, e.position, e.phone, e.document)
    );
  }, [state.data, search, dept, status]);

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      label: 'Empleado',
      sortValue: (e) => e.name,
      render: (e) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 800, bgcolor: 'surface.raised', color: 'text.primary', opacity: e.status ? 1 : 0.5 }}>
            {initials(e.name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {e.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div" noWrap>
              {e.email}
            </Typography>
          </Box>
        </Box>
      )
    },
    { key: 'position', label: 'Cargo', sortValue: (e) => e.position, render: (e) => e.position },
    { key: 'department', label: 'Departamento', sortValue: (e) => e.department, render: (e) => e.department, hideBelow: 'md' },
    { key: 'hireDate', label: 'Antigüedad', sortValue: (e) => -new Date(e.hireDate).getTime(), render: (e) => tenure(e.hireDate), hideBelow: 'lg' },
    { key: 'salary', label: 'Salario', align: 'right', sortValue: (e) => e.salary, render: (e) => formatCurrency(e.salary), hideBelow: 'md' },
    { key: 'status', label: 'Estado', render: (e) => <StatusChip label={e.status ? 'Activo' : 'Retirado'} tone={e.status ? 'ok' : 'neutral'} /> }
  ];

  const save = async (data: CreateEmployeeData) => {
    if (editing) {
      const updated = await employeesService.update(editing.id, data);
      if (selected?.id === updated.id) setSelected(updated);
      notify('Empleado actualizado');
    } else {
      await employeesService.create(data);
      notify('Empleado creado');
    }
    setFormOpen(false);
    setEditing(null);
    state.reload();
  };

  const confirmRetire = async () => {
    if (!retiring) return;
    setRetireError(null);
    try {
      const updated = await employeesService.terminate(retiring.id, retire.date, retire.reason);
      notify(`Retiro de ${updated.name} registrado`);
      setRetiring(null);
      setSelected(updated);
      state.reload();
    } catch (err) {
      setRetireError((err as Error).message);
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Empleados"
        description="El equipo de ventas, taller y administración."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
            Nuevo empleado
          </Button>
        }
      />
      <LoadGate state={state}>
        {(data) => (
          <Surface padding={0}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2.5, alignItems: { md: 'center' } }}>
              <SearchField value={search} onChange={setSearch} placeholder="Buscar por nombre, cargo o correo" />
              <ToggleButtonGroup size="small" exclusive value={status} onChange={(_, v) => v && setStatus(v)} aria-label="Filtrar por estado">
                <ToggleButton value="active">Activos</ToggleButton>
                <ToggleButton value="inactive">Retirados</ToggleButton>
                <ToggleButton value="all">Todos</ToggleButton>
              </ToggleButtonGroup>
              <TextField select fullWidth={false} label="Departamento" value={dept} onChange={(e) => setDept(e.target.value)} sx={{ minWidth: 200 }}>
                <MenuItem value="all">Todos</MenuItem>
                {data.departments.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(e) => e.id}
              onRowClick={setSelected}
              initialSort={{ key: 'name', dir: 'asc' }}
              empty={
                data.employees.length === 0 ? (
                  <EmptyState
                    icon={<BadgeOutlinedIcon />}
                    title="Todavía no hay empleados"
                    text="Agrega a tu equipo para ver la nómina y los reportes por departamento."
                    action={
                      <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
                        Nuevo empleado
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState title="Ningún empleado coincide" text="Prueba con otro término o cambia el departamento." />
                )
              }
            />
          </Surface>
        )}
      </LoadGate>

      <EmployeeForm
        open={formOpen}
        employee={editing}
        departments={state.data?.departments || []}
        positions={state.data?.positions || []}
        minimumWage={state.data?.minimumWage || 0}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={save}
      />
      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || ''}
        subtitle={selected && `${selected.position}, ${selected.department}`}
        actions={
          selected && (
            <>
              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                onClick={() => {
                  setEditing(selected);
                  setFormOpen(true);
                }}
              >
                Editar
              </Button>
              {selected.status && (
                <Button
                  color="inherit"
                  startIcon={<ExitToAppOutlinedIcon />}
                  onClick={() => {
                    setRetire({ date: toInputDate(new Date()), reason: '' });
                    setRetireError(null);
                    setRetiring(selected);
                  }}
                >
                  Registrar retiro
                </Button>
              )}
            </>
          )
        }
      >
        {selected && (
          <>
            <DetailRow label="Estado">
              <StatusChip label={selected.status ? 'Activo' : 'Retirado'} tone={selected.status ? 'ok' : 'neutral'} />
            </DetailRow>
            <DetailRow label="Documento">
              {selected.document ? `${docLabel(selected.documentType)} ${formatDocument(selected.documentType, selected.document)}` : 'Sin registrar'}
            </DetailRow>
            <DetailRow label="Correo">{selected.email}</DetailRow>
            <DetailRow label="Teléfono">{formatPhone(selected.phone)}</DetailRow>
            <DetailRow label="Contratación">{formatDate(selected.hireDate)}</DetailRow>
            <DetailRow label="Antigüedad">{tenure(selected.hireDate)}</DetailRow>
            <DetailRow label="Salario mensual">{formatCurrency(selected.salary)}</DetailRow>
            {selected.terminationDate && <DetailRow label="Fecha de retiro">{formatDate(selected.terminationDate)}</DetailRow>}
            {selected.terminationReason && <DetailRow label="Motivo">{selected.terminationReason}</DetailRow>}
          </>
        )}
      </DetailDrawer>
      <FormDialog
        open={Boolean(retiring)}
        title={`Registrar retiro de ${retiring?.name || ''}`}
        description="El empleado queda como retirado y su historial se conserva. Puedes reactivarlo editándolo."
        submitLabel="Registrar retiro"
        onClose={() => setRetiring(null)}
        onSubmit={confirmRetire}
        error={retireError}
        maxWidth="xs"
      >
        <FormGrid columns={1}>
          <Field
            label="Fecha de retiro"
            type="date"
            value={retire.date}
            onChange={(e) => setRetire((r) => ({ ...r, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <Full>
            <Field
              label="Motivo (opcional)"
              value={retire.reason}
              onChange={(e) => setRetire((r) => ({ ...r, reason: e.target.value }))}
              multiline
              minRows={2}
            />
          </Full>
        </FormGrid>
      </FormDialog>
    </>
  );
};

export default EmployeeList;
