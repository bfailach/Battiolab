const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String },
    sku: { type: String },
    unit: { type: String, default: 'UND' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // valor unitario antes de IVA
    subtotal: { type: Number, required: true, min: 0 }, // cantidad x valor unitario
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  { _id: false }
);

/** Copia de los datos del comprador al momento de facturar: la factura no cambia si el cliente se edita después. */
const customerSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    documentType: String,
    document: String,
    checkDigit: Number,
    email: String,
    phone: String,
    address: String,
    city: String
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    number: { type: String, index: true },
    sequence: { type: Number },
    client: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
      name: { type: String, required: true }
    },
    customer: customerSnapshotSchema,
    items: {
      type: [saleItemSchema],
      validate: [(v) => v.length > 0, 'La venta debe tener al menos un producto']
    },
    subtotal: { type: Number, min: 0, default: 0 },
    taxes: [{ _id: false, rate: Number, base: Number, amount: Number }],
    taxRate: { type: Number, min: 0, default: 0 }, // compatibilidad con ventas anteriores
    taxAmount: { type: Number, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentForm: { type: String, enum: ['contado', 'credito'], default: 'contado' },
    paymentMethod: { type: String },
    dueDate: { type: Date },
    paidAt: { type: Date },
    notes: { type: String, trim: true },
    status: { type: String, enum: ['completed', 'pending', 'cancelled'], default: 'pending' },
    creditNote: {
      number: String,
      date: Date,
      reason: String,
      user: String
    },
    stockApplied: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
    createdBy: { type: String }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Sale', saleSchema);
