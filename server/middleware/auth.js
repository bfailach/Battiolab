const jwt = require('jsonwebtoken');

const getSecret = () => process.env.JWT_SECRET || 'battiolab-dev-secret';

/** Exige un token JWT válido en la cabecera Authorization: Bearer <token>. */
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Inicia sesión para continuar' });
  }
  try {
    req.user = jwt.verify(token, getSecret());
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Tu sesión expiró. Inicia sesión de nuevo' });
  }
};

/** Solo permite continuar a usuarios con rol admin. */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Esta acción requiere permisos de administrador' });
  }
  return next();
};

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role }, getSecret(), { expiresIn: '24h' });

module.exports = { requireAuth, requireAdmin, signToken, getSecret };
