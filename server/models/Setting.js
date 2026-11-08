const mongoose = require('mongoose');

const DEFAULTS = {
  sales: {
    taxRate: 0,
    invoicePrefix: 'BTL-',
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
