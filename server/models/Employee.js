const mongoose = require('mongoose');
const { DOCUMENT_TYPES } = require('../utils/validators');

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'El nombre es requerido'], trim: true },
    documentType: { type: String, enum: Object.keys(DOCUMENT_TYPES), default: 'CC' },
    document: { type: String, trim: true, unique: true, sparse: true },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      trim: true,
      lowercase: true
    },
    phone: { type: String, required: [true, 'El teléfono es requerido'], trim: true },
    position: { type: String, required: [true, 'El cargo es requerido'], trim: true },
    department: { type: String, required: [true, 'El departamento es requerido'], trim: true },
    status: { type: Boolean, default: true },
    hireDate: { type: Date, required: [true, 'La fecha de contratación es requerida'] },
    terminationDate: { type: Date, default: null },
    terminationReason: { type: String, trim: true },
    salary: { type: Number, required: [true, 'El salario es requerido'], min: [0, 'El salario no puede ser negativo'] }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Employee', employeeSchema);
