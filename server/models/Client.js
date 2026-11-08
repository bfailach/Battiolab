const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  document: {
    type: String,
    required: [true, 'El documento es requerido'],
    trim: true,
    unique: true,
    set: (v) => (v === undefined || v === null ? v : String(v))
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Por favor ingrese un email válido']
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true
  },
  status: {
    type: Boolean,
    default: true
  },
  lastPurchase: {
    type: Date,
    default: null
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Client', clientSchema);
