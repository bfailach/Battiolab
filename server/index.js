require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients.routes');
const productsRoutes = require('./routes/products.routes');
const employeesRoutes = require('./routes/employees.routes');
const salesRoutes = require('./routes/sales.routes');

const app = express();

// Middleware with explicit CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3006', 'null', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Additional CORS handling for local file requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res.status(200).json({});
  }
  next();
});
// Enhanced JSON body parsing configuration
app.use(express.json({ 
  strict: false,
  limit: '10mb',
  type: ['application/json', 'text/plain'],
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('Invalid JSON received:', e.message, buf.toString());
      res.status(400).json({ error: 'Invalid JSON format' });
      throw new Error('Invalid JSON');
    }
    return true;
  }
}));

// Raw body parser for debugging
app.use((req, res, next) => {
  if (req.method === 'POST' && req.headers['content-type']?.includes('application/json')) {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      console.log('Raw request body:', data);
      try {
        // Just verify we can parse it
        JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse JSON:', e.message);
      }
    });
  }
  next();
});

app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// Add detailed debug middleware for all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request Headers:', req.headers);
    console.log('Request Body Debug:', {
      path: req.path,
      method: req.method,
      contentType: req.headers['content-type'],
      bodyType: typeof req.body,
      bodyIsEmpty: Object.keys(req.body).length === 0,
      bodyKeys: Object.keys(req.body),
      body: JSON.stringify(req.body)
    });
  }
  
  // Capture and log response data
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`Response Status: ${res.statusCode}`);
    if (res.statusCode >= 400) {
      console.log('Response Body:', body);
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Conectar a MongoDB
if (process.env.NODE_ENV === 'test') {
  // Evitar conectar a MongoDB durante la importación en tests.
  // Esto previene operaciones asíncronas (por ejemplo lista de colecciones)
  // que pueden continuar después de que Jest finaliza y generan warnings.
  console.log('NODE_ENV=test - omitiendo conexión a MongoDB en import (tests)');
} else {
  console.log('Intentando conectar a MongoDB:', process.env.MONGODB_URI || 'mongodb://localhost:27017/battiolab');
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/battiolab', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(() => {
      console.log('Conectado a MongoDB');
      mongoose.connection.db.listCollections().toArray()
        .then(collections => {
          console.log('Colecciones disponibles:', collections.map(c => c.name));
        })
        .catch(err => console.error('Error al listar colecciones:', err));
    })
    .catch(err => {
      console.error('Error al conectar a MongoDB:', err);
      console.error('Detalles de conexión:',
        {
          uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/battiolab',
          errorName: err.name,
          errorMessage: err.message,
          errorStack: err.stack
        }
      );
    });
}

// Ruta de prueba para verificar el parsing de JSON
app.post('/api/test-body-parser', (req, res) => {
  console.log('Test body parser - Request Headers:', req.headers);
  console.log('Test body parser - Request Body:', req.body);
  console.log('Test body parser - Body type:', typeof req.body);
  console.log('Test body parser - Body keys:', Object.keys(req.body));
  
  res.json({
    success: true,
    receivedBody: req.body,
    bodyType: typeof req.body,
    bodyKeys: Object.keys(req.body)
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/sales', salesRoutes);

const PORT = process.env.PORT || 3006; // Changed from 3005 to avoid conflicts

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
} else {
  // Export app for testing (supertest) without starting the listener
  module.exports = app;
}
