import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
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
import { NAV, NavChild, findActive } from './nav';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { brand } from '../../theme';
import { initials } from '../../utils/format';
import productsService from '../../services/products.service';
import salesService, { isOverdue } from '../../services/sales.service';
import settingsService from '../../services/settings.service';
import { stockLevel } from '../shared/ChargeMeter';

const SIDEBAR_WIDTH = 256;

/** Contadores para las insignias del menú: productos en alerta y facturas vencidas. */
const useBadges = (pathname: string) => {
  const [badges, setBadges] = useState<Record<NonNullable<NavChild['badgeKey']>, number>>({ lowStock: 0, overdue: 0 });
  useEffect(() => {
    let alive = true;
    Promise.all([
      productsService.getAll(),
      settingsService.get('inventory').catch(() => ({ lowStockThreshold: 5 })),
      salesService.getAll({ status: 'pending' }).catch(() => [])
    ])
      .then(([products, inv, pending]) => {
        if (!alive) return;
        setBadges({
          lowStock: products.filter((p) => p.status !== 'discontinued' && stockLevel(p.stock, p.minStock, inv.lowStockThreshold) !== 'ok').length,
          overdue: pending.filter(isOverdue).length
        });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [pathname]);
  return badges;
};

const Sidebar: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { module: activeModule, child: activeChild } = findActive(pathname);
  const badges = useBadges(pathname);
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
      <ButtonBase onClick={() => go('/dashboard')} sx={{ px: 3, py: 3, justifyContent: 'flex-start' }} aria-label="Ir al inicio">
        <Logo size={26} />
      </ButtonBase>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.75, pb: 2 }}>
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
                  px: 1.75,
                  py: 1.1,
                  borderRadius: 999,
                  color: isActive ? sb.activeText : sb.muted,
                  bgcolor: isActive ? sb.active : 'transparent',
                  transition: 'background-color 120ms, color 120ms',
                  '&:hover': { bgcolor: isActive ? sb.active : sb.hover, color: isActive ? sb.activeText : sb.text },
                  '& svg': { fontSize: 20 }
                }}
              >
                {m.icon}
                <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem' }}>{m.label}</Typography>
              </ButtonBase>

              {m.children && isActive && (
                <Box sx={{ mt: 0.75, mb: 1.5, pl: 1 }}>
                  {m.children.map((c) => {
                    const childActive = activeChild?.path === c.path;
                    const count = c.badgeKey ? badges[c.badgeKey] : 0;
                    return (
                      <ButtonBase
                        key={c.path}
                        onClick={() => go(`${m.path}/${c.path}`)}
                        aria-current={childActive ? 'page' : undefined}
                        sx={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          gap: 1.5,
                          pl: 2.25,
                          pr: 1.25,
                          py: 0.85,
                          borderRadius: 999,
                          color: childActive ? sb.text : sb.muted,
                          fontSize: '0.875rem',
                          fontWeight: childActive ? 700 : 500,
                          '&:hover': { color: sb.text, bgcolor: sb.hover }
                        }}
                      >
                        <Box
                          component="span"
                          sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: childActive ? brand.charge : 'transparent' }}
                        />
                        <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
                          {c.label}
                        </Box>
                        {count > 0 && (
                          <Box
                            component="span"
                            aria-label={`${count} pendientes`}
                            sx={{ minWidth: 22, px: 0.75, borderRadius: 999, bgcolor: brand.charge, color: '#000', fontSize: '0.75rem', fontWeight: 800, lineHeight: '20px', textAlign: 'center' }}
                          >
                            {count}
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
        <Box sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, bgcolor: 'sidebar.bg', borderRight: `1px solid ${alpha('#FFFFFF', 0.08)}` }}>
          <Box sx={{ position: 'sticky', top: 0, height: '100vh' }}>
            <Sidebar />
          </Box>
        </Box>
      ) : (
        <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { border: 'none', borderRadius: 0 } }}>
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
            height: 68,
            px: { xs: 2, md: 5 },
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: alpha(theme.palette.background.default, 0.82),
            backdropFilter: 'blur(12px)',
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
              <Typography color="text.primary" sx={{ fontWeight: 700 }} noWrap>
                {child.label}
              </Typography>
            )}
          </Breadcrumbs>

          {pathname !== '/dashboard/sales/new' && (
            <Button
              variant="contained"
              color="charge"
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
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'text.primary', color: 'background.default', fontSize: 14, fontWeight: 800 }}>
                {initials(displayName)}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={menuEl}
            open={Boolean(menuEl)}
            onClose={() => setMenuEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { mt: 1, minWidth: 250 } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontWeight: 700 }}>{displayName}</Typography>
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

        <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 5 }, py: { xs: 3, md: 5 }, maxWidth: 1480, width: '100%' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppShell;
