const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  username: {
    type: String,
    sparse: true,
    unique: true,
    default: function() {
      // Set username to email by default if not provided
      return this.email ? this.email.split('@')[0] : null;
    }
  },
  password: {
    type: String,
    required: true
  },
  siteCode: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'admin'  // Por ahora, todos los usuarios serán admin
  }
}, {
  timestamps: true
});

// Hash la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    console.log('Iniciando hash de contraseña para usuario:', this.email);
    
    if (!this.password || typeof this.password !== 'string') {
      throw new Error(`Contraseña inválida: ${typeof this.password}`);
    }
    
    const salt = await bcrypt.genSalt(10);
    console.log('Salt generado correctamente');
    
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Contraseña encriptada correctamente');
    
    next();
  } catch (error) {
    console.error('Error en hash de contraseña:', error);
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
