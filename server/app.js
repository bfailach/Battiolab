const express = require('express');
const cors = require('cors');
const { requireAuth } = require('./middleware/auth');

const app = express();

// La app de Electron carga desde file:// (origin "null") en producción y desde localhost:3000 en desarrollo
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,null')
  .split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '2mb' }));

// Errores de JSON mal formado
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'El cuerpo de la petición no es JSON válido' });
  return next(err);
});

// Registro de peticiones (sin cuerpos, para no exponer contraseñas)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`));
    next();
  });
}

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', requireAuth, require('./routes/clients.routes'));
app.use('/api/products', requireAuth, require('./routes/products.routes'));
app.use('/api/employees', requireAuth, require('./routes/employees.routes'));
app.use('/api/sales', requireAuth, require('./routes/sales.routes'));
app.use('/api/lots', requireAuth, require('./routes/lots.routes'));
app.use('/api/settings', requireAuth, require('./routes/settings.routes'));
app.use('/api/movements', requireAuth, require('./routes/movements.routes'));

app.use('/api', (req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

module.exports = app;
