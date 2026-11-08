const mongoose = require('mongoose');

/** Registro de cada entrada o salida de inventario. */
const stockMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['in', 'out', 'adjust'], required: true },
    quantity: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    reason: {
      type: String,
      enum: ['sale', 'sale_cancelled', 'lot', 'scan', 'manual', 'return'],
      default: 'manual'
    },
    reference: { type: String },
    note: { type: String, trim: true },
    user: { type: String }
  },
  { timestamps: true, versionKey: false }
);

stockMovementSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
