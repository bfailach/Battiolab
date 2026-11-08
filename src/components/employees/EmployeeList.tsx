import React, { useMemo, useState } from 'react';
import { Avatar, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, initials, yearsSince } from '../../utils/format';
import { brand } from '../../theme';

const tenure = (d: string) => {
  const y = yearsSince(d);
  if (y < 1) return `${Math.max(0, Math.round(y * 12))} meses`;
  return `${y.toFixed(1).replace('.', ',')} años`;
};

const EmployeeList: React.FC = () => {
  const { notify, confirm } = useUI();
  const { isAdmin } = useAuth();
  const state = useEmployeesData();
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (state.data?.employees || []).filter(
      (e) =>
        (dept === 'all' || e.department === dept) &&
        (!q || [e.name, e.email, e.position, e.phone].some((v) => v?.toLowerCase().includes(q)))
    );
  }, [state.data, search, dept]);

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      label: 'Empleado',
      sortValue: (e) => e.name,
      render: (e) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, bgcolor: e.status ? brand.violetSoft : 'action.disabled' }}>
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
    { key: 'status', label: 'Estado', render: (e) => <StatusChip label={e.status ? 'Activo' : 'Inactivo'} tone={e.status ? 'ok' : 'neutral'} /> }
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

  const remove = async (e: Employee) => {
    const ok = await confirm({
      title: `¿Eliminar a ${e.name}?`,
      message: 'Si solo dejó de trabajar aquí, márcalo como inactivo para conservar su registro.',
      confirmLabel: 'Eliminar empleado',
      destructive: true
    });
    if (!ok) return;
    try {
      await employeesService.delete(e.id);
      notify('Empleado eliminado');
      setSelected(null);
      state.reload();
    } catch (err) {
      notify((err as Error).message, 'error');
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2 }}>
              <SearchField value={search} onChange={setSearch} placeholder="Buscar por nombre, cargo o correo" />
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
              {isAdmin && (
                <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => remove(selected)}>
                  Eliminar
                </Button>
              )}
            </>
          )
        }
      >
        {selected && (
          <>
            <DetailRow label="Estado">
              <StatusChip label={selected.status ? 'Activo' : 'Inactivo'} tone={selected.status ? 'ok' : 'neutral'} />
            </DetailRow>
            <DetailRow label="Correo">{selected.email}</DetailRow>
            <DetailRow label="Teléfono">{selected.phone}</DetailRow>
            <DetailRow label="Contratación">{formatDate(selected.hireDate)}</DetailRow>
            <DetailRow label="Antigüedad">{tenure(selected.hireDate)}</DetailRow>
            <DetailRow label="Salario mensual">{formatCurrency(selected.salary)}</DetailRow>
          </>
        )}
      </DetailDrawer>
    </>
  );
};

export default EmployeeList;
