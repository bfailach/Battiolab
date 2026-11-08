import React, { useEffect, useState } from 'react';
import { Autocomplete, FormControlLabel, Grid, InputAdornment, Switch, TextField } from '@mui/material';
import FormDialog from '../shared/FormDialog';
import { CreateEmployeeData, Employee } from '../../services/employees.service';
import { toInputDate } from '../../utils/format';

const empty = (): CreateEmployeeData => ({
  name: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  status: true,
  hireDate: toInputDate(new Date()),
  salary: 0
});

const EmployeeForm: React.FC<{
  open: boolean;
  employee?: Employee | null;
  departments: string[];
  positions: string[];
  onClose: () => void;
  onSubmit: (data: CreateEmployeeData) => Promise<void>;
}> = ({ open, employee, departments, positions, onClose, onSubmit }) => {
  const [form, setForm] = useState<CreateEmployeeData>(empty());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      employee
        ? {
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            position: employee.position,
            department: employee.department,
            status: employee.status,
            hireDate: toInputDate(employee.hireDate),
            salary: employee.salary
          }
        : empty()
    );
    setErrors({});
    setError(null);
  }, [open, employee]);

  const set = (k: keyof CreateEmployeeData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === 'salary' ? Number(e.target.value) : e.target.value }));

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Escribe el nombre';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Escribe un correo válido';
    if (!form.phone.trim()) next.phone = 'Escribe el teléfono';
    if (!form.position.trim()) next.position = 'Elige o escribe un cargo';
    if (!form.department.trim()) next.department = 'Elige o escribe un departamento';
    if (!form.hireDate) next.hireDate = 'Indica la fecha';
    if (!(form.salary >= 0)) next.salary = 'El salario no puede ser negativo';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title={employee ? 'Editar empleado' : 'Nuevo empleado'}
      submitLabel={employee ? 'Guardar cambios' : 'Crear empleado'}
      onClose={onClose}
      onSubmit={submit}
      submitting={submitting}
      error={error}
    >
      <TextField label="Nombre completo" value={form.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} autoFocus required />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Correo" type="email" value={form.email} onChange={set('email')} error={!!errors.email} helperText={errors.email} required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Teléfono" value={form.phone} onChange={set('phone')} error={!!errors.phone} helperText={errors.phone} required />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={departments}
            value={form.department}
            onInputChange={(_, v) => setForm((f) => ({ ...f, department: v }))}
            renderInput={(p) => <TextField {...p} label="Departamento" error={!!errors.department} helperText={errors.department} required />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={positions}
            value={form.position}
            onInputChange={(_, v) => setForm((f) => ({ ...f, position: v }))}
            renderInput={(p) => <TextField {...p} label="Cargo" error={!!errors.position} helperText={errors.position} required />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Fecha de contratación"
            type="date"
            value={form.hireDate}
            onChange={set('hireDate')}
            InputLabelProps={{ shrink: true }}
            error={!!errors.hireDate}
            helperText={errors.hireDate}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Salario mensual"
            type="number"
            value={form.salary || ''}
            onChange={set('salary')}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, inputProps: { min: 0, step: 10000 } }}
            error={!!errors.salary}
            helperText={errors.salary}
            required
          />
        </Grid>
      </Grid>
      <FormControlLabel
        control={<Switch checked={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))} />}
        label={form.status ? 'Empleado activo' : 'Empleado inactivo'}
      />
    </FormDialog>
  );
};

export default EmployeeForm;
