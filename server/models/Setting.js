const mongoose = require('mongoose');

const DEFAULTS = {
  company: {
    legalName: '',
    tradeName: 'Battiolab',
    nit: '',
    checkDigit: '',
    taxRegime: 'responsable',
    taxNotes: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    resolutionNumber: '',
    resolutionDate: '',
    resolutionPrefix: '',
    resolutionFrom: 0,
    resolutionTo: 0,
    resolutionValidUntil: '',
    invoiceFooter: '',
    uvt: 52374,
    minimumWage: 1750905
  },
  sales: {
    invoicePrefix: 'BTL-',
    creditNotePrefix: 'NC-',
    defaultCreditDays: 30,
    defaultStatus: 'completed',
    paymentMethods: ['Efectivo', 'Tarjeta', 'Transferencia', 'Financiación'],
    allowNegativeStock: false
  },
  employees: {
    departments: ['Ventas', 'Taller', 'Administración', 'Bodega'],
    positions: ['Asesor comercial', 'Técnico', 'Jefe de taller', 'Auxiliar de bodega', 'Administrador'],
    salaryCurrency: 'COP'
  },
  inventory: {
    lowStockThreshold: 5,
    categories: ['Scooters', 'Motos', 'Baterías', 'Repuestos']
  }
};

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, enum: Object.keys(DEFAULTS) },
    value: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, versionKey: false }
);

settingSchema.statics.get = async function get(key) {
  const doc = await this.findOne({ key }).lean();
  return { ...DEFAULTS[key], ...(doc?.value || {}) };
};

const Setting = mongoose.model('Setting', settingSchema);
Setting.DEFAULTS = DEFAULTS;

module.exports = Setting;
