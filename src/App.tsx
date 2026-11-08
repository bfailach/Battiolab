import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AppShell from './components/layout/AppShell';
import Home from './components/Dashboard';
import ClientsPage from './components/clients/ClientsPage';
import EmployeesPage from './components/employees/EmployeesPage';
import InventoryPage from './components/inventory/InventoryPage';
import SalesPage from './components/sales/SalesPage';
import CompanySettings from './components/company/CompanySettings';
import { Loading } from './components/shared/Page';

const PrivateArea: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Verificando tu sesión…" />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <AppShell>
      <Routes>
        <Route index element={<Home />} />
        <Route path="clients/*" element={<ClientsPage />} />
        <Route path="employees/*" element={<EmployeesPage />} />
        <Route path="inventory/*" element={<InventoryPage />} />
        <Route path="sales/*" element={<SalesPage />} />
        <Route path="company" element={<CompanySettings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
};

const PublicOnly: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const App = () => (
  <UIProvider>
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/dashboard/*" element={<PrivateArea />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  </UIProvider>
);

export default App;
