const router = require('express').Router();
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Lot = require('../models/Lot');
const { requireAdmin } = require('../middleware/auth');
const { changeStock, setStock } = require('../services/stock');
const Sale = require('../models/Sale');
const v = require('../utils/validators');
const { asyncHandler, httpError } = require('../utils/asyncHandler');

/** Normaliza y valida los campos editables de un producto. */
const parse = (body, current = {}) => {
  const m = { ...current, ...body };
  const data = {
    name: String(m.name || '').trim().replace(/\s+/g, ' '),
    sku: v.cleanSku(m.sku),
    category: String(m.category || '').trim(),
    description: String(m.description || '').trim(),
    price: v.toMoney(m.price),
    priceIncludesTax: Boolean(m.priceIncludesTax),
    taxRate: m.taxRate === undefined || m.taxRate === null || m.taxRate === '' ? 19 : Number(m.taxRate),
    unit: String(m.unit || 'UND').trim().toUpperCase(),
    minStock: m.minStock === '' || m.minStock === undefined ? 0 : Number(m.minStock),
    imageUrl: m.imageUrl || undefined,
    status: m.status || 'active'
  };
  const errors = [];
  if (data.name.length < 3) errors.push('Escribe el nombre del producto');
  const skuErr = v.validateSku(data.sku);
  if (skuErr) errors.push(skuErr);
  if (!data.category) errors.push('Elige una categoría');
  if (!Number.isFinite(data.price) || data.price < 0) errors.push('El precio debe ser un valor positivo en pesos');
  if (!v.TAX_RATES.includes(data.taxRate)) errors.push('La tarifa de IVA debe ser 0 %, 5 % o 19 %');
  if (!Number.isInteger(data.minStock) || data.minStock < 0) errors.push('El stock mínimo debe ser un entero positivo');
  if (!['active', 'inactive', 'discontinued'].includes(data.status)) errors.push('Estado no válido');
  if (errors.length) throw httpError(400, errors.join('. '));
  return data;
};
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
  const data = parse(req.body);
  if (await Product.findOne({ sku: data.sku })) throw httpError(400, 'Ya existe un producto con ese SKU');
  const initialStock = req.body.stock === '' || req.body.stock === undefined ? 0 : Number(req.body.stock);
  if (!Number.isInteger(initialStock) || initialStock < 0) throw httpError(400, 'El stock inicial debe ser un entero positivo');
  const product = await Product.create({ ...data, stock: 0 });
  if (initialStock > 0) {
    await changeStock({ productId: product._id, delta: initialStock, reason: 'manual', note: 'Stock inicial', user: req.user?.email });
  }
  res.status(201).json(await Product.findById(product._id));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const current = await Product.findById(req.params.id);
  if (!current) throw httpError(404, 'Producto no encontrado');
  const data = parse(req.body, current.toObject());
  if (await Product.findOne({ sku: data.sku, _id: { $ne: req.params.id } })) {
    throw httpError(400, 'Ya existe un producto con ese SKU');
  }
  // El stock no se edita aquí: cambia con ventas, lotes y ajustes, que quedan registrados
  Object.assign(current, data);
  if (!data.imageUrl) current.imageUrl = undefined;
  await current.save();
  res.json(current);
}));

/** Solo se elimina un producto creado por error, sin ventas ni lotes; los demás se descontinúan. */
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw httpError(404, 'Producto no encontrado');
  const [sold, lots] = await Promise.all([Sale.exists({ 'items.productId': product._id }), Lot.exists({ product: product._id })]);
  if (sold || lots) {
    throw httpError(409, 'Este producto tiene ventas o lotes registrados. Márcalo como descontinuado para conservar el historial.');
  }
  await StockMovement.deleteMany({ product: product._id });
  await product.deleteOne();
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
