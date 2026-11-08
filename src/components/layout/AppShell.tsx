import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Divider,
  Drawer,
  IconButton,
  ListItemIcon,
  Grow,
  Menu,
  MenuItem,
  Popper,
  SxProps,
  Theme,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import Logo from '../shared/Logo';
import { NAV, NavChild, NavModule, findActive } from './nav';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { brand } from '../../theme';
import { initials } from '../../utils/format';
import productsService from '../../services/products.service';
import salesService, { isOverdue } from '../../services/sales.service';
import settingsService from '../../services/settings.service';
import { stockLevel } from '../shared/ChargeMeter';

type BadgeKey = NonNullable<NavChild['badgeKey']>;

/** Contadores para las insignias del menú: productos en alerta y facturas vencidas. */
const useBadges = (pathname: string) => {
  const [badges, setBadges] = useState<Record<BadgeKey, number>>({ lowStock: 0, overdue: 0 });
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

const moduleCount = (m: NavModule, badges: Record<BadgeKey, number>) =>
  (m.children || []).reduce((sum, c) => sum + (c.badgeKey ? badges[c.badgeKey] : 0), 0);

/** Vidrio ahumado: violeta oscuro translúcido con desenfoque del contenido que pasa por debajo. */
const smokedGlass: SxProps<Theme> = {
  bgcolor: (t: Theme) => alpha('#1E1A2E', t.palette.mode === 'dark' ? 0.62 : 0.74),
  backdropFilter: 'blur(22px) saturate(160%)',
  WebkitBackdropFilter: 'blur(22px) saturate(160%)',
  border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
  boxShadow: `0 12px 32px ${alpha('#0E0B18', 0.35)}, inset 0 1px 0 ${alpha('#FFFFFF', 0.06)}`,
  color: '#FFFFFF'
};

const Count: React.FC<{ n: number }> = ({ n }) => (
  <Box
    component="span"
    aria-label={`${n} pendientes`}
    sx={{ minWidth: 20, px: 0.6, borderRadius: 999, bgcolor: brand.charge, color: brand.violet, fontSize: '0.6875rem', fontWeight: 800, lineHeight: '18px', textAlign: 'center' }}
  >
    {n}
  </Box>
);

/** Menú completo para pantallas angostas. */
const MobileMenu: React.FC<{ open: boolean; onClose: () => void; badges: Record<BadgeKey, number> }> = ({ open, onClose, badges }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { module: active, child } = findActive(pathname);
  const go = (to: string) => {
    navigate(to);
    onClose();
  };
  return (
    <Drawer anchor="top" open={open} onClose={onClose} PaperProps={{ sx: { ...smokedGlass, borderRadius: '0 0 24px 24px', border: 0, maxHeight: '90vh' } as SxProps<Theme> }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2 }}>
        <Logo size={24} />
        <IconButton onClick={onClose} aria-label="Cerrar menú" sx={{ color: '#fff' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box component="nav" aria-label="Navegación principal" sx={{ px: 1.5, pb: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
        {NAV.map((m) => {
          const isActive = active?.path === m.path;
          return (
            <Box key={m.path} sx={{ p: 1, borderRadius: 4, bgcolor: isActive ? alpha('#FFFFFF', 0.06) : 'transparent' }}>
              <ButtonBase
                onClick={() => go(m.children ? `${m.path}/${m.children[0].path}` : m.path)}
                sx={{ width: '100%', justifyContent: 'flex-start', gap: 1.25, px: 1.25, py: 1, borderRadius: 999, fontWeight: 700, color: isActive ? brand.charge : '#fff', '& svg': { fontSize: 20 } }}
              >
                {m.icon}
                {m.label}
              </ButtonBase>
              {m.children?.map((c) => {
                const n = c.badgeKey ? badges[c.badgeKey] : 0;
                const on = isActive && child?.path === c.path;
                return (
                  <ButtonBase
                    key={c.path}
                    onClick={() => go(`${m.path}/${c.path}`)}
                    sx={{ width: '100%', justifyContent: 'space-between', pl: 5, pr: 1.25, py: 0.75, borderRadius: 999, fontSize: '0.875rem', fontWeight: on ? 700 : 500, color: on ? '#fff' : alpha('#FFFFFF', 0.7) }}
                  >
                    {c.label}
                    {n > 0 && <Count n={n} />}
                  </ButtonBase>
                );
              })}
            </Box>
          );
        })}
      </Box>
    </Drawer>
  );
};

/**
 * Módulo de la barra superior. Al pasar el mouse (o enfocar con el teclado) despliega sus secciones.
 */
const NavItem: React.FC<{ module: NavModule; active: boolean; activeChild?: string; badges: Record<BadgeKey, number> }> = ({
  module: m,
  active,
  activeChild,
  badges
}) => {
  const navigate = useNavigate();
  const anchor = useRef<HTMLButtonElement>(null);
  const timer = useRef<number>();
  const [open, setOpen] = useState(false);
  const n = moduleCount(m, badges);

  const show = () => {
    window.clearTimeout(timer.current);
    if (m.children) setOpen(true);
  };
  // Pequeña espera al salir para poder llevar el mouse del botón al panel
  const hide = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), 140);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <Box onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <ButtonBase
        ref={anchor}
        onClick={() => go(m.children ? `${m.path}/${m.children[0].path}` : m.path)}
        aria-current={active ? 'page' : undefined}
        aria-haspopup={m.children ? 'menu' : undefined}
        aria-expanded={m.children ? open : undefined}
        sx={{
          position: 'relative',
          gap: 0.875,
          px: 1.75,
          height: 40,
          borderRadius: 999,
          fontWeight: 700,
          fontSize: '0.875rem',
          color: active ? brand.violet : alpha('#FFFFFF', 0.8),
          bgcolor: active ? brand.charge : open ? alpha('#FFFFFF', 0.08) : 'transparent',
          transition: 'background-color 140ms, color 140ms',
          '&:hover': { color: active ? brand.violet : '#FFFFFF', bgcolor: active ? brand.charge : alpha('#FFFFFF', 0.08) },
          '& svg': { fontSize: 18 }
        }}
      >
        {m.icon}
        {m.label}
        {m.children && (
          <ExpandMoreIcon sx={{ fontSize: '16px !important', ml: -0.25, opacity: 0.7, transition: 'transform 160ms', transform: open ? 'rotate(180deg)' : 'none' }} />
        )}
        {n > 0 && !active && (
          <Box component="span" aria-label={`${n} pendientes`} sx={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', bgcolor: brand.charge }} />
        )}
      </ButtonBase>
      {m.children && (
        <Popper open={open} anchorEl={anchor.current} placement="bottom" transition sx={{ zIndex: 1300 }} modifiers={[{ name: 'offset', options: { offset: [0, 14] } }]}>
          {({ TransitionProps }) => (
            <Grow {...TransitionProps} style={{ transformOrigin: 'top center' }} timeout={140}>
              <Box
                role="menu"
                aria-label={m.label}
                onMouseEnter={show}
                onMouseLeave={hide}
                sx={{ ...smokedGlass, width: 236, p: 0.75, borderRadius: 4 } as SxProps<Theme>}
              >
                {(m.children || []).map((c) => {
                  const on = active && activeChild === c.path;
                  const count = c.badgeKey ? badges[c.badgeKey] : 0;
                  return (
                    <ButtonBase
                      key={c.path}
                      role="menuitem"
                      onClick={() => go(`${m.path}/${c.path}`)}
                      sx={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        gap: 1.25,
                        px: 1.5,
                        height: 38,
                        borderRadius: 3,
                        fontSize: '0.875rem',
                        fontWeight: on ? 800 : 600,
                        color: on ? '#FFFFFF' : alpha('#FFFFFF', 0.78),
                        bgcolor: on ? alpha('#FFFFFF', 0.1) : 'transparent',
                        '&:hover, &:focus-visible': { color: '#FFFFFF', bgcolor: alpha('#FFFFFF', 0.1) }
                      }}
                    >
                      <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: on ? brand.charge : 'transparent' }} />
                      <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
                        {c.label}
                      </Box>
                      {count > 0 && <Count n={count} />}
                    </ButtonBase>
                  );
                })}
              </Box>
            </Grow>
          )}
        </Popper>
      )}
    </Box>
  );
};

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('lg'));
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountEl, setAccountEl] = useState<HTMLElement | null>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useUI();
  const { module: active, child } = findActive(pathname);
  const badges = useBadges(pathname);
  const email = user?.user.email || '';
  const displayName = user?.user.name || email.split('@')[0];

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const plainIcon = { color: 'text.primary', '&:hover': { bgcolor: 'action.hover' } };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar,
          px: { xs: 1.5, md: 3 },
          py: { xs: 1.25, md: 1.5 },
          // Franja con desvanecido para que el logo y las acciones se lean sobre el contenido al hacer scroll
          background: `linear-gradient(180deg, ${theme.palette.background.default} 55%, ${alpha(theme.palette.background.default, 0)} 100%)`
        }}
      >
        <Box
          sx={{
            maxWidth: 1480,
            mx: 'auto',
            minHeight: 60,
            display: 'grid',
            gridTemplateColumns: wide ? '1fr auto 1fr' : 'auto 1fr auto',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.primary' }}>
            {!wide && (
              <IconButton onClick={() => setMenuOpen(true)} aria-label="Abrir menú" sx={plainIcon}>
                <MenuIcon />
              </IconButton>
            )}
            <ButtonBase onClick={() => navigate('/dashboard')} aria-label="Ir al inicio" sx={{ px: 1, py: 1, borderRadius: 999 }}>
              <Logo size={24} color="currentColor" />
            </ButtonBase>
          </Box>

          {wide ? (
            <Box
              component="nav"
              aria-label="Navegación principal"
              sx={{ ...smokedGlass, display: 'flex', alignItems: 'center', gap: 0.25, p: 0.625, borderRadius: 999 } as SxProps<Theme>}
            >
              {NAV.map((m) => (
                <NavItem key={m.path} module={m} active={active?.path === m.path} activeChild={child?.path} badges={badges} />
              ))}
            </Box>
          ) : (
            <Typography sx={{ fontWeight: 700, textAlign: 'center', color: 'text.primary' }} noWrap>
              {active?.label}
              {child ? ` / ${child.label}` : ''}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75 }}>
            {pathname !== '/dashboard/sales/new' && (
              <Button
                variant="contained"
                color="charge"
                startIcon={<AddIcon />}
                onClick={() => navigate('/dashboard/sales/new')}
                sx={{ display: { xs: 'none', sm: 'inline-flex' }, height: 40 }}
              >
                Nueva venta
              </Button>
            )}
            <Tooltip title={mode === 'light' ? 'Usar tema oscuro' : 'Usar tema claro'}>
              <IconButton onClick={toggleMode} aria-label="Cambiar tema" sx={plainIcon}>
                {mode === 'light' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Tu cuenta">
              <IconButton onClick={(e) => setAccountEl(e.currentTarget)} aria-label="Abrir menú de cuenta" sx={{ p: 0.5 }}>
                <Avatar sx={{ width: 38, height: 38, bgcolor: brand.magenta, color: '#FFFFFF', fontSize: 14, fontWeight: 800 }}>{initials(displayName)}</Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Menu
        anchorEl={accountEl}
        open={Boolean(accountEl)}
        onClose={() => setAccountEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { mt: 1.5, minWidth: 250 } }}
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
            setAccountEl(null);
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

      {!wide && <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} badges={badges} />}

      <Box component="main" sx={{ px: { xs: 2, md: 5 }, pt: { xs: 2, md: 3 }, pb: 6, maxWidth: 1480, mx: 'auto', width: '100%' }}>
        {children}
      </Box>
    </Box>
  );
};

export default AppShell;
