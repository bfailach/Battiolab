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
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface ClientFormData {
  name: string;
  document: string;
  email: string;
  phone: string;
  status: boolean;
}

interface ClientFormProps {
  initialData?: ClientFormData;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const FormContainer = styled(Paper)({
  padding: '24px',
  backgroundColor: 'white',
  borderRadius: 3,
});

const ActionButton = styled(Button)({
  textTransform: 'none',
  borderRadius: 3,
  padding: '8px 16px',
  fontWeight: 700,
});

const SaveButton = styled(ActionButton)({
  backgroundColor: '#3D365C',
  color: 'white',
  '&:hover': {
    backgroundColor: '#2D284C',
  },
});

const ClientForm = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: ClientFormProps) => {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    document: '',
    email: '',
    phone: '',
    status: true,
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<ClientFormData>>({});

  const validateForm = () => {
    const newErrors: Partial<ClientFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.document.trim()) {
      newErrors.document = 'El documento es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure all fields are present and properly formatted
    if (validateForm()) {
      // Create a fresh object with explicit property assignments to avoid any reference issues
      // and ensure the document field is explicitly converted to a string
      const dataToSubmit = {
        name: formData.name.trim(),
        document: String(formData.document).trim(), // Explicitly convert to string
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        status: Boolean(formData.status)
      };
      
      // Log the data being submitted to help debug
      console.log('Form data being submitted:', dataToSubmit);
      
      onSubmit(dataToSubmit);
    }
  };

  const handleChange = (field: keyof ClientFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [field]: field === 'status' ? e.target.checked : e.target.value,
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
        {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nombre"
            value={formData.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name}
            required
          />

          <TextField
            label="Documento"
            value={formData.document}
            onChange={handleChange('document')}
            error={!!errors.document}
            helperText={errors.document}
            required
          />

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            required
          />

          <TextField
            label="Teléfono"
            value={formData.phone}
            onChange={handleChange('phone')}
            error={!!errors.phone}
            helperText={errors.phone}
            required
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.status}
                onChange={handleChange('status')}
                color="primary"
              />
            }
            label="Cliente Activo"
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <SaveButton type="submit">
              {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
            </SaveButton>
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{ borderColor: '#3D365C', color: '#3D365C' }}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </form>
    </FormContainer>
  );
};

export default ClientForm;
