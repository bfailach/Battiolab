require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
require('./models/Client');
require('./models/Employee');
require('./models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/battiolab';
const PORT = process.env.PORT || 3006;

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET no está definido: se usa una clave de desarrollo. Defínelo en server/.env antes de usar en producción.');
}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('Conectado a MongoDB');
    // Ajusta los índices a los modelos actuales (p. ej. el correo del cliente dejó de ser único y obligatorio)
    for (const name of ['Client', 'Employee', 'Product']) {
      await mongoose.model(name).syncIndexes().catch((e) => console.warn(`Índices de ${name}:`, e.message));
    }
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  });
