const router = require('express').Router();
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Lot = require('../models/Lot');
const { requireAdmin } = require('../middleware/auth');
const { changeStock, setStock } = require('../services/stock');
const { asyncHandler, httpError } = require('../utils/asyncHandler');

const FIELDS = ['name', 'sku', 'category', 'description', 'price', 'minStock', 'imageUrl', 'status'];
const pick = (body) => Object.fromEntries(FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', asyncHandler(async (req, res) => {
  const query = req.query.category ? { category: req.query.category } : {};
  res.json(await Product.find(query).sort({ createdAt: -1 }));
}));

// Búsqueda exacta por SKU (lector de código de barras), sin distinguir mayúsculas
router.get('/sku/:sku', asyncHandler(async (req, res) => {
  const sku = String(req.params.sku).trim();
  const product = await Product.findOne({ sku: new RegExp(`^${escapeRegex(sku)}$`, 'i') });
  if (!product) throw httpError(404, `No hay ningún producto con el código ${sku}`);
  res.json(product);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw httpError(404, 'Producto no encontrado');
  res.json(product);
}));

router.get('/:id/movements', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json(await StockMovement.find({ product: req.params.id }).sort({ createdAt: -1 }).limit(limit));
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = pick(req.body);
  if (data.sku && (await Product.findOne({ sku: data.sku }))) throw httpError(400, 'Ya existe un producto con ese SKU');
  const initialStock = Number(req.body.stock) || 0;
  const product = await Product.create({ ...data, stock: 0 });
  if (initialStock > 0) {
    await changeStock({ productId: product._id, delta: initialStock, reason: 'manual', note: 'Stock inicial', user: req.user?.email });
  }
  res.status(201).json(await Product.findById(product._id));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const data = pick(req.body);
  if (data.sku && (await Product.findOne({ sku: data.sku, _id: { $ne: req.params.id } }))) {
    throw httpError(400, 'Ya existe un producto con ese SKU');
  }
  const updated = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!updated) throw httpError(404, 'Producto no encontrado');
  if (req.body.stock !== undefined && Number(req.body.stock) !== updated.stock) {
    await setStock({ productId: updated._id, stock: Number(req.body.stock), note: 'Edición de producto', user: req.user?.email });
  }
  res.json(await Product.findById(updated._id));
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) throw httpError(404, 'Producto no encontrado');
  await Promise.all([StockMovement.deleteMany({ product: deleted._id }), Lot.deleteMany({ product: deleted._id })]);
  res.json({ message: 'Producto eliminado' });
}));

// Fijar el stock a un valor exacto (conteo físico)
router.patch('/:id/stock', asyncHandler(async (req, res) => {
  const product = await setStock({ productId: req.params.id, stock: req.body.stock, note: req.body.note, user: req.user?.email });
  res.json(product);
}));

// Sumar o restar unidades (entradas/salidas desde el escáner)
router.post('/:id/stock/move', asyncHandler(async (req, res) => {
  const delta = Number(req.body.delta);
  if (!Number.isInteger(delta) || delta === 0) throw httpError(400, 'La cantidad debe ser un número entero distinto de 0');
  const product = await changeStock({
    productId: req.params.id,
    delta,
    reason: req.body.reason === 'return' ? 'return' : 'scan',
    note: req.body.note,
    user: req.user?.email
  });
  res.json(product);
}));

module.exports = router;
