const mongoose = require('mongoose');
const { DOCUMENT_TYPES } = require('../utils/validators');

const clientSchema = new mongoose.Schema(
  {
    personType: { type: String, enum: ['natural', 'juridica'], default: 'natural' },
    name: { type: String, required: [true, 'El nombre es requerido'], trim: true },
    documentType: { type: String, enum: Object.keys(DOCUMENT_TYPES), default: 'CC' },
    document: { type: String, required: [true, 'El documento es requerido'], trim: true, unique: true },
    checkDigit: { type: Number, min: 0, max: 9 },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: [true, 'El teléfono es requerido'], trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    status: { type: Boolean, default: true },
    isFinalConsumer: { type: Boolean, default: false },
    lastPurchase: { type: Date, default: null },
    totalPurchases: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Client', clientSchema);
