require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/battiolab';
const PORT = process.env.PORT || 3006;

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET no está definido: se usa una clave de desarrollo. Defínelo en server/.env antes de usar en producción.');
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  });
