const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String },
  description: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  imageUrl: { type: String },
  status: { type: String, default: 'active' }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Product', productSchema);
