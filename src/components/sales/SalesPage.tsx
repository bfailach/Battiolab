import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import SalesList from './SalesList';
import NewSale from './NewSale';
import SalesReports from './SalesReports';
import SalesSettings from './SalesSettings';

const SalesPage = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<SalesList />} />
    <Route path="new" element={<NewSale />} />
    <Route path="reports" element={<SalesReports />} />
    <Route path="settings" element={<SalesSettings />} />
    <Route path="*" element={<Navigate to="list" replace />} />
  </Routes>
);

export default SalesPage;
