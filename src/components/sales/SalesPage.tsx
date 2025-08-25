import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import SalesList from './SalesList';
import NewSale from './NewSale';
import SalesReports from './SalesReports';
import SubNavigation from '../shared/SubNavigation';

const navItems = [
  { path: 'list', label: 'Lista de Ventas' },
  { path: 'new', label: 'Nueva Venta' },
  { path: 'reports', label: 'Reportes' },
  { path: 'settings', label: 'Configuración' }
];

const SalesPage = () => {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || '';

  return (
    <Box>
      <SubNavigation
        items={navItems}
        basePath="/dashboard/sales"
        currentPath={currentPath}
      />

      <Routes>
        <Route path="/" element={<Navigate to="list" replace />} />
        <Route path="list" element={<SalesList />} />
        <Route path="new" element={<NewSale />} />
        <Route path="reports" element={<SalesReports />} />
        <Route path="settings" element={<Box p={3}>Configuración (en desarrollo)</Box>} />
      </Routes>
    </Box>
  );
};

export default SalesPage;
