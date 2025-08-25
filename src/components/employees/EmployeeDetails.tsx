import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Employee } from '../../services/employees.service';

interface EmployeeDetailsProps {
  employee: Employee;
  onEdit: () => void;
  onBack: () => void;
}

const DetailsContainer = styled(Paper)({
  padding: '24px',
  backgroundColor: 'white',
  borderRadius: 3,
});

const DetailSection = styled(Box)({
  marginBottom: '24px',
});

const DetailLabel = styled(Typography)({
  color: '#666',
  fontWeight: 600,
  fontSize: '0.875rem',
});

const DetailValue = styled(Typography)({
  color: '#303030',
  fontSize: '1rem',
});

const StatusChip = styled(Chip)({
  borderRadius: 3,
  fontWeight: 700,
  '&.active': {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  '&.inactive': {
    backgroundColor: '#FF5252',
    color: 'white',
  },
});

const ActionButton = styled(Button)({
  textTransform: 'none',
  borderRadius: 3,
  padding: '8px 16px',
  fontWeight: 700,
});

const EditButton = styled(ActionButton)({
  backgroundColor: '#C95792',
  color: 'white',
  '&:hover': {
    backgroundColor: '#B94B82',
  },
});

const BackButton = styled(ActionButton)({
  backgroundColor: '#3D365C',
  color: 'white',
  '&:hover': {
    backgroundColor: '#2D284C',
  },
});

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({
  employee,
  onEdit,
  onBack,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DetailsContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#303030', fontWeight: 700 }}>
          Detalles del Empleado
        </Typography>
        <StatusChip
          label={employee.status ? 'Activo' : 'Inactivo'}
          className={employee.status ? 'active' : 'inactive'}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <DetailSection>
            <DetailLabel>Nombre</DetailLabel>
            <DetailValue>{employee.name}</DetailValue>
          </DetailSection>

          <DetailSection>
            <DetailLabel>Email</DetailLabel>
            <DetailValue>{employee.email}</DetailValue>
          </DetailSection>

          <DetailSection>
            <DetailLabel>Teléfono</DetailLabel>
            <DetailValue>{employee.phone}</DetailValue>
          </DetailSection>
        </Grid>

        <Grid item xs={12} md={6}>
          <DetailSection>
            <DetailLabel>Cargo</DetailLabel>
            <DetailValue>{employee.position}</DetailValue>
          </DetailSection>

          <DetailSection>
            <DetailLabel>Departamento</DetailLabel>
            <DetailValue>{employee.department}</DetailValue>
          </DetailSection>

          <DetailSection>
            <DetailLabel>Fecha de Contratación</DetailLabel>
            <DetailValue>{formatDate(employee.hireDate)}</DetailValue>
          </DetailSection>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <DetailSection>
        <DetailLabel>Salario</DetailLabel>
        <DetailValue sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#3D365C' }}>
          {formatCurrency(employee.salary)}
        </DetailValue>
      </DetailSection>

      <DetailSection>
        <DetailLabel>Fecha de Registro</DetailLabel>
        <DetailValue>{formatDate(employee.createdAt)}</DetailValue>
      </DetailSection>

      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <BackButton onClick={onBack}>
          Volver
        </BackButton>
        <EditButton onClick={onEdit}>
          Editar Empleado
        </EditButton>
      </Box>
    </DetailsContainer>
  );
};

export default EmployeeDetails; 