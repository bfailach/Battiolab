import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import authService from '../../services/auth.service';

const StyledAppBar = styled(AppBar)({
  backgroundColor: '#3D365C',
  boxShadow: 'none',
});

const NavButton = styled(Button)({
  color: 'white',
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 700,
  '&.active': {
    color: '#F8B55F',
  },
});

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isInventorySection = location.pathname.startsWith('/dashboard/inventory');
  const isClientsSection = location.pathname.startsWith('/dashboard/clients');
  const isSalesSection = location.pathname.startsWith('/dashboard/sales');
  const isEmployeesSection = location.pathname.startsWith('/dashboard/employees');

  return (
    <StyledAppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/dashboard')}
        >
          Battiolab
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <NavButton
            className={isActive('/dashboard') ? 'active' : ''}
            onClick={() => navigate('/dashboard')}
          >
            Inicio
          </NavButton>
          <NavButton
            className={isClientsSection ? 'active' : ''}
            onClick={() => navigate('/dashboard/clients')}
          >
            Clientes
          </NavButton>
          <NavButton
            className={isEmployeesSection ? 'active' : ''}
            onClick={() => navigate('/dashboard/employees')}
          >
            Empleados
          </NavButton>
          <NavButton
            className={isInventorySection ? 'active' : ''}
            onClick={() => navigate('/dashboard/inventory')}
          >
            Inventario
          </NavButton>
          <NavButton
            className={isSalesSection ? 'active' : ''}
            onClick={() => navigate('/dashboard/sales')}
          >
            Ventas
          </NavButton>
        </Box>
        <Tooltip title="Cerrar sesión">
          <IconButton 
            color="inherit" 
            onClick={() => {
              authService.logout();
              navigate('/');
            }}
            sx={{ ml: 2 }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Navbar;
