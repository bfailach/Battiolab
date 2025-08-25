import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import EmployeeList from './EmployeeList';
import EmployeesByDepartment from './EmployeesByDepartment';
import SubNavigation from '../shared/SubNavigation';

const navItems = [
  { path: 'list', label: 'Lista de Empleados' },
  { path: 'departments', label: 'Departamentos' },
  { path: 'reports', label: 'Reportes' },
  { path: 'settings', label: 'Configuración' }
];

const EmployeesPage = () => {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || '';

  return (
    <Box>
      <SubNavigation
        items={navItems}
        basePath="/dashboard/employees"
        currentPath={currentPath}
      />

      <Routes>
        <Route path="/" element={<Navigate to="list" replace />} />
        <Route path="list/*" element={<EmployeeList />} />
        <Route path="departments" element={<EmployeesByDepartment />} />
        <Route path="reports" element={<Box p={3}>Reportes (en desarrollo)</Box>} />
        <Route path="settings" element={<Box p={3}>Configuración (en desarrollo)</Box>} />
      </Routes>
    </Box>
  );
};

export default EmployeesPage;
