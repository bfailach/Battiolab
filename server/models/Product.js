const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: { type: String },
    description: { type: String },
    // Precio de venta. Si priceIncludesTax es true es el precio final al público (IVA incluido);
    // si no, es el valor antes de IVA.
    price: { type: Number, required: true, min: 0 },
    priceIncludesTax: { type: Boolean, default: false },
    taxRate: { type: Number, enum: [0, 5, 19], default: 19 },
    unit: { type: String, default: 'UND' },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Product', productSchema);
