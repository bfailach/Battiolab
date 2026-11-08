import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import InventoryData from './InventoryData';
import InventoryAlerts from './InventoryAlerts';
import ProductCatalog from './ProductCatalog';
import InventoryLots from './InventoryLots';
import InventoryScanning from './InventoryScanning';

const InventoryPage = () => (
  <Routes>
    <Route index element={<Navigate to="data" replace />} />
    <Route path="data" element={<InventoryData />} />
    <Route path="alerts" element={<InventoryAlerts />} />
    <Route path="products" element={<ProductCatalog />} />
    <Route path="lots" element={<InventoryLots />} />
    <Route path="scanning" element={<InventoryScanning />} />
    <Route path="*" element={<Navigate to="data" replace />} />
  </Routes>
);

export default InventoryPage;
