import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import employeesService from '../../services/employees.service';

// Estilos personalizados
const SectionTitle = styled(Typography)({
  fontSize: '1.5rem',
  fontWeight: 600,
  color: '#303030',
  marginBottom: 16,
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: '#3D365C',
  color: 'white',
}));

const StyledCard = styled(Card)({
  backgroundColor: 'white',
  borderRadius: 8,
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});

const StatNumber = styled(Typography)({
  fontSize: '2rem',
  fontWeight: 700,
  color: '#3D365C',
});

// Interfaces
interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: boolean;
  salary: number;
  hireDate: string;
}

interface DepartmentSummary {
  name: string;
  count: number;
  totalSalary: number;
  employees: Employee[];
}

// Función para formatear moneda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Función para formatear fecha
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const EmployeesByDepartment: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departmentSummaries, setDepartmentSummaries] = useState<DepartmentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const data = await employeesService.getAll();
        setEmployees(data);
        
        // Procesar datos por departamento
        processEmployeesByDepartment(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar empleados');
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const processEmployeesByDepartment = (employeesList: Employee[]) => {
    // Crear un mapa para acumular información por departamento
    const departmentMap = new Map<string, {
      count: number;
      totalSalary: number;
      employees: Employee[];
    }>();

    // Procesar cada empleado
    employeesList.forEach(employee => {
      const department = employee.department;
      
      if (!departmentMap.has(department)) {
        departmentMap.set(department, {
          count: 0,
          totalSalary: 0,
          employees: []
        });
      }
      
      const deptSummary = departmentMap.get(department)!;
      deptSummary.count++;
      deptSummary.totalSalary += employee.salary;
      deptSummary.employees.push(employee);
    });

    // Convertir el mapa en un array ordenado por número de empleados
    const summaries = Array.from(departmentMap.entries()).map(([name, summary]) => ({
      name,
      count: summary.count,
      totalSalary: summary.totalSalary,
      employees: summary.employees.sort((a, b) => a.name.localeCompare(b.name))
    }));

    // Ordenar por número de empleados (descendente)
    summaries.sort((a, b) => b.count - a.count);
    
    setDepartmentSummaries(summaries);
    
    // Seleccionar el primer departamento por defecto si hay departamentos
    if (summaries.length > 0) {
      setSelectedDepartment(summaries[0].name);
    }
  };

  const getSelectedDepartmentData = () => {
    if (!selectedDepartment) return null;
    return departmentSummaries.find(dept => dept.name === selectedDepartment);
  };

  const selectedDepartmentData = getSelectedDepartmentData();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, color: '#303030', fontWeight: 700 }}>
        Empleados por Departamento
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Estadísticas generales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <StyledCard>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total de Empleados
                  </Typography>
                  <StatNumber>
                    {employees.length}
                  </StatNumber>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={4}>
              <StyledCard>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total de Departamentos
                  </Typography>
                  <StatNumber>
                    {departmentSummaries.length}
                  </StatNumber>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={4}>
              <StyledCard>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Promedio de Salario
                  </Typography>
                  <StatNumber>
                    {employees.length > 0
                      ? formatCurrency(employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length)
                      : formatCurrency(0)}
                  </StatNumber>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>

          {/* Resumen por departamentos */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <SectionTitle>
                Resumen por Departamentos
              </SectionTitle>
              <Paper sx={{ p: 0, mb: 3 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Departamento</StyledTableCell>
                        <StyledTableCell align="center">Empleados</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {departmentSummaries.map((dept) => (
                        <TableRow 
                          key={dept.name}
                          hover
                          selected={selectedDepartment === dept.name}
                          onClick={() => setSelectedDepartment(dept.name)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{dept.name}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={dept.count} 
                              color={selectedDepartment === dept.name ? "primary" : "default"}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <SectionTitle>
                Detalles del Departamento: {selectedDepartment || 'Ninguno seleccionado'}
              </SectionTitle>
              
              {selectedDepartmentData ? (
                <Paper>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">
                      {selectedDepartmentData.name}
                    </Typography>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Nómina: {formatCurrency(selectedDepartmentData.totalSalary)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Promedio Salarial: {formatCurrency(selectedDepartmentData.totalSalary / selectedDepartmentData.count)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider />
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <StyledTableCell>Nombre</StyledTableCell>
                          <StyledTableCell>Cargo</StyledTableCell>
                          <StyledTableCell>Fecha Contratación</StyledTableCell>
                          <StyledTableCell align="right">Salario</StyledTableCell>
                          <StyledTableCell align="center">Estado</StyledTableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedDepartmentData.employees.map((employee) => (
                          <TableRow key={employee.id} hover>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {employee.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {employee.email}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{employee.position}</TableCell>
                            <TableCell>{formatDate(employee.hireDate)}</TableCell>
                            <TableCell align="right">{formatCurrency(employee.salary)}</TableCell>
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={employee.status ? 'Activo' : 'Inactivo'}
                                color={employee.status ? 'success' : 'default'}
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              ) : (
                <Alert severity="info">
                  Selecciona un departamento para ver sus detalles.
                </Alert>
              )}
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default EmployeesByDepartment;
