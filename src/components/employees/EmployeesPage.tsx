import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import EmployeeList from './EmployeeList';
import EmployeesByDepartment from './EmployeesByDepartment';
import EmployeeReports from './EmployeeReports';
import EmployeeSettings from './EmployeeSettings';

const EmployeesPage = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<EmployeeList />} />
    <Route path="departments" element={<EmployeesByDepartment />} />
    <Route path="reports" element={<EmployeeReports />} />
    <Route path="settings" element={<EmployeeSettings />} />
    <Route path="*" element={<Navigate to="list" replace />} />
  </Routes>
);

export default EmployeesPage;
