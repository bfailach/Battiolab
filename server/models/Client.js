const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  document: {
    type: String,
    // Temporarily make the field not required to debug what's happening
    required: false, // Changed from true to false
    trim: true,
    unique: true,
    default: 'default-document', // Add a default value as a fallback
    // Ensure value is processed correctly
    set: v => v ? v.toString() : 'default-document'
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
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Client', clientSchema);
