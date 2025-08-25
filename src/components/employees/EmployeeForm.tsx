import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
  Alert,
  InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Employee, CreateEmployeeData } from '../../services/employees.service';

interface EmployeeFormProps {
  initialData?: Employee;
  onSubmit: (data: CreateEmployeeData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

interface EmployeeFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  status?: string;
  hireDate?: string;
  salary?: string;
}

const FormContainer = styled(Paper)({
  padding: '24px',
  backgroundColor: 'white',
  borderRadius: 3,
});

const SubmitButton = styled(Button)({
  backgroundColor: '#3D365C',
  color: 'white',
  '&:hover': {
    backgroundColor: '#2D284C',
  },
});

const CancelButton = styled(Button)({
  backgroundColor: '#C95792',
  color: 'white',
  '&:hover': {
    backgroundColor: '#B94B82',
  },
});

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<CreateEmployeeData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    position: initialData?.position || '',
    department: initialData?.department || '',
    status: initialData?.status ?? true,
    hireDate: initialData?.hireDate ? new Date(initialData.hireDate).toISOString().split('T')[0] : '',
    salary: initialData?.salary || 0,
  });

  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const validateForm = () => {
    const newErrors: EmployeeFormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'El cargo es requerido';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'El departamento es requerido';
    }

    if (!formData.hireDate) {
      newErrors.hireDate = 'La fecha de contratación es requerida';
    }

    if (formData.salary <= 0) {
      newErrors.salary = 'El salario debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (validateForm()) {
      try {
        await onSubmit(formData);
      } catch (error: any) {
        setSubmitError(error.message);
      }
    }
  };

  const handleChange = (field: keyof CreateEmployeeData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value: string | number | boolean = e.target.value;

    if (field === 'status') {
      value = e.target.checked;
    } else if (field === 'salary') {
      // Remover formato de moneda y convertir a número
      value = Number(e.target.value.replace(/[^0-9]/g, ''));
    } else {
      value = e.target.value;
    }

    setFormData({
      ...formData,
      [field]: value,
    });

    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: undefined,
      });
    }
  };

  return (
    <FormContainer>
      <Typography variant="h5" sx={{ mb: 3, color: '#303030', fontWeight: 700 }}>
        {isEditing ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <TextField
            label="Nombre"
            value={formData.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
          />

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
          />

          <TextField
            label="Teléfono"
            value={formData.phone}
            onChange={handleChange('phone')}
            error={!!errors.phone}
            helperText={errors.phone}
            fullWidth
          />

          <TextField
            label="Cargo"
            value={formData.position}
            onChange={handleChange('position')}
            error={!!errors.position}
            helperText={errors.position}
            fullWidth
          />

          <TextField
            label="Departamento"
            value={formData.department}
            onChange={handleChange('department')}
            error={!!errors.department}
            helperText={errors.department}
            fullWidth
          />

          <TextField
            label="Fecha de Contratación"
            type="date"
            value={formData.hireDate}
            onChange={handleChange('hireDate')}
            error={!!errors.hireDate}
            helperText={errors.hireDate}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Salario"
            value={formData.salary ? formatCurrency(formData.salary) : ''}
            onChange={handleChange('salary')}
            error={!!errors.salary}
            helperText={errors.salary}
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.status}
                onChange={handleChange('status')}
                color="primary"
              />
            }
            label="Empleado Activo"
          />
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {submitError}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <CancelButton
            variant="contained"
            onClick={onCancel}
          >
            Cancelar
          </CancelButton>
          <SubmitButton
            type="submit"
            variant="contained"
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Empleado'}
          </SubmitButton>
        </Box>
      </form>
    </FormContainer>
  );
};

export default EmployeeForm; 