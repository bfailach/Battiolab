import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import ClientList from './ClientList';
import ClientGroups from './ClientGroups';
import ClientHistory from './ClientHistory';
import ClientReports from './ClientReports';
import SubNavigation from '../shared/SubNavigation';

const navItems = [
  { path: 'list', label: 'Lista de Clientes' },
  { path: 'groups', label: 'Grupos' },
  { path: 'history', label: 'Historial' },
  { path: 'reports', label: 'Reportes' }
];

const ClientsPage = () => {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || '';

  return (
    <Box>
      <SubNavigation
        items={navItems}
        basePath="/dashboard/clients"
        currentPath={currentPath}
      />

      <Routes>
        <Route path="/" element={<Navigate to="list" replace />} />
        <Route path="list/*" element={<ClientList />} />
        <Route path="groups" element={<ClientGroups />} />
        <Route path="history" element={<ClientHistory />} />
        <Route path="reports" element={<ClientReports />} />
      </Routes>
    </Box>
  );
};

export default ClientsPage; 