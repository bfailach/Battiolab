const mongoose = require('mongoose');

const lotSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: [true, 'El producto es requerido'] },
    lotNumber: { type: String, required: [true, 'El número de lote es requerido'], trim: true },
    quantity: { type: Number, required: true, min: [1, 'La cantidad debe ser al menos 1'] },
    unitCost: { type: Number, min: 0, default: 0 },
    supplier: { type: String, trim: true },
    receivedAt: { type: Date, default: Date.now },
    warrantyUntil: { type: Date },
    notes: { type: String, trim: true },
    createdBy: { type: String }
  },
  { timestamps: true, versionKey: false }
);

lotSchema.index({ product: 1, lotNumber: 1 }, { unique: true });

module.exports = mongoose.model('Lot', lotSchema);
