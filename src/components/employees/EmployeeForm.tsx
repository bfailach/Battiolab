import React, { useEffect, useState } from 'react';
import { Alert, Autocomplete, FormControlLabel, Switch, TextField } from '@mui/material';
import FormDialog, { FormGrid, Full } from '../shared/FormDialog';
import { DocumentFields, NumberField, PhoneField } from '../shared/Fields';
import { CreateEmployeeData, Employee } from '../../services/employees.service';
import { formatCurrency, toInputDate } from '../../utils/format';
import { validateDocument, validateEmail, validateName, validatePhone } from '../../utils/validation';

const empty = (): CreateEmployeeData => ({
  name: '',
  documentType: 'CC',
  document: '',
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
  minimumWage: number;
  onClose: () => void;
  onSubmit: (data: CreateEmployeeData) => Promise<void>;
}> = ({ open, employee, departments, positions, minimumWage, onClose, onSubmit }) => {
  const [form, setForm] = useState<CreateEmployeeData>(empty());
  const [salary, setSalary] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (employee) {
      setForm({
        name: employee.name,
        documentType: employee.documentType,
        document: employee.document || '',
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        status: employee.status,
        hireDate: toInputDate(employee.hireDate),
        salary: employee.salary
      });
      setSalary(employee.salary);
    } else {
      setForm(empty());
      setSalary(null);
    }
    setErrors({});
    setError(null);
  }, [open, employee]);

  const set = <K extends keyof CreateEmployeeData>(k: K, v: CreateEmployeeData[K]) => setForm((f) => ({ ...f, [k]: v }));
  const belowMinimum = !!salary && !!minimumWage && salary < minimumWage;

  const submit = async () => {
    const next = {
      name: validateName(form.name),
      document: validateDocument(form.documentType, form.document),
      email: validateEmail(form.email, true),
      phone: validatePhone(form.phone),
      position: form.position.trim() ? null : 'Elige o escribe un cargo',
      department: form.department.trim() ? null : 'Elige o escribe un departamento',
      hireDate: form.hireDate ? null : 'Indica la fecha',
      salary: salary && salary > 0 ? null : 'Escribe el salario mensual'
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ ...form, salary: salary || 0 });
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
      <FormGrid>
        <Full>
          <TextField label="Nombre completo" value={form.name} onChange={(e) => set('name', e.target.value)} error={!!errors.name} helperText={errors.name || ' '} autoFocus required />
        </Full>
        <DocumentFields
          type={form.documentType}
          value={form.document}
          onTypeChange={(t) => set('documentType', t)}
          onValueChange={(v) => set('document', v)}
          error={errors.document}
          types={['CC', 'CE', 'PP', 'PPT']}
        />
        <TextField label="Correo" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={!!errors.email} helperText={errors.email || ' '} required />
        <PhoneField value={form.phone} onValueChange={(v) => set('phone', v)} error={!!errors.phone} helperText={errors.phone || ' '} required />
        <Autocomplete
          freeSolo
          options={departments}
          value={form.department}
          onInputChange={(_, v) => set('department', v)}
          renderInput={(p) => <TextField {...p} label="Departamento" error={!!errors.department} helperText={errors.department || ' '} required />}
        />
        <Autocomplete
          freeSolo
          options={positions}
          value={form.position}
          onInputChange={(_, v) => set('position', v)}
          renderInput={(p) => <TextField {...p} label="Cargo" error={!!errors.position} helperText={errors.position || ' '} required />}
        />
        <TextField
          label="Fecha de contratación"
          type="date"
          value={form.hireDate}
          onChange={(e) => set('hireDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          error={!!errors.hireDate}
          helperText={errors.hireDate || ' '}
          required
        />
        <NumberField
          label="Salario mensual"
          money
          value={salary}
          onValueChange={setSalary}
          error={!!errors.salary}
          helperText={errors.salary || (minimumWage ? `Mínimo legal: ${formatCurrency(minimumWage)}` : ' ')}
          required
        />
        {belowMinimum && (
          <Full>
            <Alert severity="warning">El salario está por debajo del mínimo legal. Solo es válido para contratos de medio tiempo o por horas.</Alert>
          </Full>
        )}
        {employee && (
          <Full>
            <FormControlLabel
              control={<Switch checked={form.status} onChange={(e) => set('status', e.target.checked)} />}
              label={form.status ? 'Empleado activo' : 'Empleado retirado'}
            />
          </Full>
        )}
      </FormGrid>
    </FormDialog>
  );
};

export default EmployeeForm;
