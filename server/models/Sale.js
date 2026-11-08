const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    number: { type: String, index: true },
    client: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
      name: { type: String, required: true }
    },
    items: {
      type: [saleItemSchema],
      validate: [(v) => v.length > 0, 'La venta debe tener al menos un producto']
    },
    subtotal: { type: Number, min: 0, default: 0 },
    taxRate: { type: Number, min: 0, default: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String },
    notes: { type: String, trim: true },
    status: { type: String, enum: ['completed', 'pending', 'cancelled'], default: 'pending' },
    stockApplied: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
    createdBy: { type: String }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Sale', saleSchema);
