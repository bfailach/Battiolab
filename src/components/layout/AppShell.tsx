import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  ButtonBase,
  Divider,
  Drawer,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import Logo from '../shared/Logo';
import { NAV, findActive } from './nav';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { brand } from '../../theme';
import { initials } from '../../utils/format';
import productsService from '../../services/products.service';
import settingsService from '../../services/settings.service';
import { stockLevel } from '../shared/ChargeMeter';

const SIDEBAR_WIDTH = 248;

/** Cuenta los productos en alerta para mostrarlo junto a "Alertas". */
const useLowStockCount = (pathname: string) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    Promise.all([productsService.getAll(), settingsService.get('inventory').catch(() => ({ lowStockThreshold: 5 }))])
      .then(([products, inv]) => {
        if (!alive) return;
        setCount(
          products.filter((p) => p.status !== 'discontinued' && stockLevel(p.stock, p.minStock, inv.lowStockThreshold) !== 'ok')
            .length
        );
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [pathname]);
  return count;
};

const Sidebar: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { module: activeModule, child: activeChild } = findActive(pathname);
  const lowStock = useLowStockCount(pathname);
  const sb = theme.palette.sidebar;

  const go = (to: string) => {
    navigate(to);
    onNavigate?.();
  };

  return (
    <Box
      component="nav"
      aria-label="Navegación principal"
      sx={{ width: SIDEBAR_WIDTH, height: '100%', bgcolor: sb.bg, color: sb.text, display: 'flex', flexDirection: 'column' }}
    >
      <ButtonBase
        onClick={() => go('/dashboard')}
        sx={{ px: 2.5, py: 2.5, justifyContent: 'flex-start', borderRadius: 0 }}
        aria-label="Ir al inicio"
      >
        <Logo size={26} />
      </ButtonBase>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
        {NAV.map((m) => {
          const isActive = activeModule?.path === m.path;
          const target = m.children ? `${m.path}/${m.children[0].path}` : m.path;
          return (
            <Box key={m.path} sx={{ mb: 0.5 }}>
              <ButtonBase
                onClick={() => go(target)}
                aria-current={isActive && !m.children ? 'page' : undefined}
                sx={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  gap: 1.5,
                  px: 1.25,
                  py: 1,
                  borderRadius: 2,
                  color: isActive ? sb.text : sb.muted,
                  bgcolor: isActive ? alpha('#FFFFFF', 0.08) : 'transparent',
                  '&:hover': { bgcolor: sb.hover, color: sb.text },
                  '& svg': { fontSize: 20, color: isActive ? brand.charge : 'inherit' }
                }}
              >
                {m.icon}
                <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>{m.label}</Typography>
              </ButtonBase>

              {m.children && isActive && (
                <Box sx={{ ml: 2.75, mt: 0.5, mb: 1, borderLeft: `1px solid ${alpha('#FFFFFF', 0.12)}` }}>
                  {m.children.map((c) => {
                    const childActive = activeChild?.path === c.path;
                    return (
                      <ButtonBase
                        key={c.path}
                        onClick={() => go(`${m.path}/${c.path}`)}
                        aria-current={childActive ? 'page' : undefined}
                        sx={{
                          width: '100%',
                          justifyContent: 'space-between',
                          pl: 1.75,
                          pr: 1,
                          py: 0.75,
                          ml: '-1px',
                          borderLeft: `2px solid ${childActive ? brand.charge : 'transparent'}`,
                          color: childActive ? sb.text : sb.muted,
                          fontSize: '0.875rem',
                          fontWeight: childActive ? 600 : 500,
                          '&:hover': { color: sb.text }
                        }}
                      >
                        {c.label}
                        {c.badgeKey === 'lowStock' && lowStock > 0 && (
                          <Box
                            component="span"
                            aria-label={`${lowStock} productos en alerta`}
                            sx={{
                              minWidth: 22,
                              px: 0.75,
                              borderRadius: 999,
                              bgcolor: brand.charge,
                              color: brand.night,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              lineHeight: '20px',
                              textAlign: 'center'
                            }}
                          >
                            {lowStock}
                          </Box>
                        )}
                      </ButtonBase>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuEl, setMenuEl] = useState<HTMLElement | null>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useUI();
  const { module, child } = findActive(pathname);
  const email = user?.user.email || '';
  const displayName = user?.user.name || email.split('@')[0];

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isDesktop ? (
        <Box sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, bgcolor: 'sidebar.bg' }}>
          <Box sx={{ position: 'sticky', top: 0, height: '100vh' }}>
            <Sidebar />
          </Box>
        </Box>
      ) : (
        <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { border: 'none' } }}>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: theme.zIndex.appBar,
            height: 60,
            px: { xs: 2, md: 4 },
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: alpha(theme.palette.background.default, 0.85),
            backdropFilter: 'blur(8px)',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          {!isDesktop && (
            <IconButton onClick={() => setMobileOpen(true)} aria-label="Abrir menú" edge="start">
              <MenuIcon />
            </IconButton>
          )}
          <Breadcrumbs aria-label="Ubicación" sx={{ flex: 1, minWidth: 0, '& ol': { flexWrap: 'nowrap' } }}>
            <Typography color={child ? 'text.secondary' : 'text.primary'} sx={{ fontWeight: 600 }} noWrap>
              {module?.label || 'Battiolab'}
            </Typography>
            {child && (
              <Typography color="text.primary" sx={{ fontWeight: 600 }} noWrap>
                {child.label}
              </Typography>
            )}
          </Breadcrumbs>

          {pathname !== '/dashboard/sales/new' && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/dashboard/sales/new')}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Nueva venta
            </Button>
          )}
          <Tooltip title={mode === 'light' ? 'Usar tema oscuro' : 'Usar tema claro'}>
            <IconButton onClick={toggleMode} aria-label="Cambiar tema">
              {mode === 'light' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Tu cuenta">
            <IconButton onClick={(e) => setMenuEl(e.currentTarget)} aria-label="Abrir menú de cuenta" sx={{ p: 0.5 }}>
              <Badge
                overlap="circular"
                variant="dot"
                invisible={user?.user.role !== 'admin'}
                sx={{ '& .MuiBadge-dot': { bgcolor: brand.charge } }}
              >
                <Avatar sx={{ width: 34, height: 34, bgcolor: brand.magenta, fontSize: 14, fontWeight: 700 }}>
                  {initials(displayName)}
                </Avatar>
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={menuEl}
            open={Boolean(menuEl)}
            onClose={() => setMenuEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ variant: 'outlined', sx: { mt: 1, minWidth: 240 } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontWeight: 600 }}>{displayName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.user.role === 'admin' ? 'Administrador' : 'Usuario'}
                {user?.user.siteCode ? `, sede ${user.user.siteCode}` : ''}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setMenuEl(null);
                logout();
                navigate('/login');
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Box>

        <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 }, maxWidth: 1440, width: '100%' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppShell;
