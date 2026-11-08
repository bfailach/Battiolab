import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ClientList from './ClientList';
import ClientGroups from './ClientGroups';
import ClientHistory from './ClientHistory';
import ClientReports from './ClientReports';

const ClientsPage = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<ClientList />} />
    <Route path="groups" element={<ClientGroups />} />
    <Route path="history" element={<ClientHistory />} />
    <Route path="reports" element={<ClientReports />} />
    <Route path="*" element={<Navigate to="list" replace />} />
  </Routes>
);

export default ClientsPage;
