import React from 'react';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';

export interface NavChild {
  path: string;
  label: string;
  badgeKey?: 'lowStock';
}

export interface NavModule {
  path: string;
  label: string;
  icon: React.ReactNode;
  children?: NavChild[];
}

export const NAV: NavModule[] = [
  { path: '/dashboard', label: 'Inicio', icon: <SpaceDashboardOutlinedIcon /> },
  {
    path: '/dashboard/sales',
    label: 'Ventas',
    icon: <PointOfSaleOutlinedIcon />,
    children: [
      { path: 'list', label: 'Lista de ventas' },
      { path: 'new', label: 'Nueva venta' },
      { path: 'reports', label: 'Reportes' },
      { path: 'settings', label: 'Configuración' }
    ]
  },
  {
    path: '/dashboard/inventory',
    label: 'Inventario',
    icon: <Inventory2OutlinedIcon />,
    children: [
      { path: 'data', label: 'Existencias' },
      { path: 'alerts', label: 'Alertas', badgeKey: 'lowStock' },
      { path: 'products', label: 'Catálogo' },
      { path: 'lots', label: 'Lotes' },
      { path: 'scanning', label: 'Escaneo' }
    ]
  },
  {
    path: '/dashboard/clients',
    label: 'Clientes',
    icon: <PeopleAltOutlinedIcon />,
    children: [
      { path: 'list', label: 'Lista de clientes' },
      { path: 'groups', label: 'Grupos' },
      { path: 'history', label: 'Historial' },
      { path: 'reports', label: 'Reportes' }
    ]
  },
  {
    path: '/dashboard/employees',
    label: 'Empleados',
    icon: <BadgeOutlinedIcon />,
    children: [
      { path: 'list', label: 'Lista de empleados' },
      { path: 'departments', label: 'Departamentos' },
      { path: 'reports', label: 'Reportes' },
      { path: 'settings', label: 'Configuración' }
    ]
  }
];

/** Módulo y subpágina activos según la ruta, para el sidebar y las migas. */
export const findActive = (pathname: string) => {
  const module =
    NAV.filter((m) => m.path !== '/dashboard').find((m) => pathname.startsWith(m.path)) ||
    (pathname.replace(/\/$/, '') === '/dashboard' ? NAV[0] : undefined);
  const child = module?.children?.find((c) => pathname.startsWith(`${module.path}/${c.path}`));
  return { module, child };
};
