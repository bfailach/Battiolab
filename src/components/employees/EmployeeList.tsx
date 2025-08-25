import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Chip, Modal } from '@mui/material';
import { styled } from '@mui/material/styles';
import employeesService, { Employee, CreateEmployeeData } from '../../services/employees.service';
import EmployeeForm from './EmployeeForm';
import EmployeeDetails from './EmployeeDetails';

const SearchBar = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'white',
    borderRadius: 3,
    '& fieldset': {
      borderColor: '#E0E0E0',
    },
    '&:hover fieldset': {
      borderColor: '#C95792',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#C95792',
    },
  },
});

const ActionButton = styled(Button)({
  textTransform: 'none',
  borderRadius: 3,
  padding: '8px 16px',
  fontWeight: 700,
});

const AddButton = styled(ActionButton)({
  backgroundColor: '#3D365C',
  color: 'white',
  '&:hover': {
    backgroundColor: '#2D284C',
  },
});

const EmployeeCard = styled(Paper)({
  backgroundColor: '#F8B55F',
  borderRadius: 3,
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
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

const ModalContent = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '800px',
  maxHeight: '90vh',
  overflow: 'auto',
  outline: 'none',
});

const EmployeeList = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await employeesService.getAll();
      setEmployees(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailsOpen(true);
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedEmployee(null);
    setIsEditing(false);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedEmployee(null);
  };

  const handleCreateEmployee = async (data: CreateEmployeeData) => {
    try {
      await employeesService.create(data);
      await loadEmployees();
      setIsFormOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateEmployee = async (data: CreateEmployeeData) => {
    if (!selectedEmployee) return;
    try {
      await employeesService.update(selectedEmployee.id, data);
      await loadEmployees();
      setIsFormOpen(false);
      setSelectedEmployee(null);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#303030', fontWeight: 700 }}>
        Listado de Empleados
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SearchBar
          placeholder="Buscar empleado"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 400 }}
        />
        <ActionButton>Filtros</ActionButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <AddButton onClick={() => setIsFormOpen(true)}>
          Agregar Empleado
        </AddButton>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: 3 
      }}>
        {filteredEmployees.map((employee) => (
          <EmployeeCard key={employee.id} elevation={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {employee.name}
              </Typography>
              <StatusChip
                label={employee.status ? 'Activo' : 'Inactivo'}
                className={employee.status ? 'active' : 'inactive'}
              />
            </Box>
            
            <Typography variant="body2" sx={{ color: '#666' }}>
              {employee.position}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              {employee.department}
            </Typography>
            
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Email: {employee.email}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Teléfono: {employee.phone}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Fecha de contratación: {formatDate(employee.hireDate)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Salario: {formatCurrency(employee.salary)}
              </Typography>
            </Box>

            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              mt: 2 
            }}>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => handleViewDetails(employee)}
                sx={{ 
                  backgroundColor: '#3D365C',
                  '&:hover': {
                    backgroundColor: '#2D284C',
                  }
                }}
              >
                Ver Detalles
              </Button>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => handleEditClick(employee)}
                sx={{ 
                  backgroundColor: '#C95792',
                  '&:hover': {
                    backgroundColor: '#B94B82',
                  }
                }}
              >
                Editar
              </Button>
            </Box>
          </EmployeeCard>
        ))}
      </Box>

      <Modal
        open={isFormOpen}
        onClose={handleCloseForm}
      >
        <ModalContent>
          <EmployeeForm
            initialData={selectedEmployee || undefined}
            onSubmit={isEditing ? handleUpdateEmployee : handleCreateEmployee}
            onCancel={handleCloseForm}
            isEditing={isEditing}
          />
        </ModalContent>
      </Modal>

      <Modal
        open={isDetailsOpen}
        onClose={handleCloseDetails}
      >
        <ModalContent>
          {selectedEmployee && (
            <EmployeeDetails
              employee={selectedEmployee}
              onEdit={() => {
                handleCloseDetails();
                handleEditClick(selectedEmployee);
              }}
              onBack={handleCloseDetails}
            />
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EmployeeList; 