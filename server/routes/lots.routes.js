const router = require('express').Router();
const Lot = require('../models/Lot');
const { requireAdmin } = require('../middleware/auth');
const { changeStock } = require('../services/stock');
const { asyncHandler, httpError } = require('../utils/asyncHandler');

const toDTO = (lot) => ({
  id: lot._id.toString(),
  product: lot.product && lot.product.name !== undefined
    ? { id: lot.product._id.toString(), name: lot.product.name, sku: lot.product.sku, category: lot.product.category }
    : { id: lot.product?.toString(), name: 'Producto eliminado', sku: '' },
  lotNumber: lot.lotNumber,
  quantity: lot.quantity,
  unitCost: lot.unitCost,
  supplier: lot.supplier || '',
  receivedAt: lot.receivedAt,
  warrantyUntil: lot.warrantyUntil || null,
  notes: lot.notes || '',
  createdBy: lot.createdBy,
  createdAt: lot.createdAt
});

router.get('/', asyncHandler(async (req, res) => {
  const filter = req.query.productId ? { product: req.query.productId } : {};
  const lots = await Lot.find(filter).sort({ receivedAt: -1 }).populate('product', 'name sku category').lean();
  res.json(lots.map(toDTO));
}));

// Registrar la recepción de un lote suma sus unidades al stock del producto
router.post('/', asyncHandler(async (req, res) => {
  const { productId, lotNumber, quantity, unitCost, supplier, receivedAt, warrantyUntil, notes } = req.body;
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) throw httpError(400, 'La cantidad debe ser un número entero mayor a 0');
  if (await Lot.findOne({ product: productId, lotNumber })) {
    throw httpError(400, 'Ese número de lote ya está registrado para este producto');
  }
  const lot = await Lot.create({
    product: productId, lotNumber, quantity: qty, unitCost, supplier,
    receivedAt: receivedAt || Date.now(), warrantyUntil: warrantyUntil || undefined, notes,
    createdBy: req.user?.email
  });
  try {
    await changeStock({ productId, delta: qty, reason: 'lot', reference: lotNumber, user: req.user?.email });
  } catch (error) {
    await lot.deleteOne();
    throw error;
  }
  const full = await Lot.findById(lot._id).populate('product', 'name sku category').lean();
  res.status(201).json(toDTO(full));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const allowed = ['supplier', 'unitCost', 'receivedAt', 'warrantyUntil', 'notes', 'lotNumber'];
  const data = Object.fromEntries(allowed.filter((k) => req.body[k] !== undefined).map((k) => [k, req.body[k] || undefined]));
  const lot = await Lot.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    .populate('product', 'name sku category').lean();
  if (!lot) throw httpError(404, 'Lote no encontrado');
  res.json(toDTO(lot));
}));

// Eliminar un lote retira sus unidades del stock (si todavía están disponibles)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const lot = await Lot.findById(req.params.id);
  if (!lot) throw httpError(404, 'Lote no encontrado');
  await changeStock({
    productId: lot.product, delta: -lot.quantity, reason: 'manual',
    reference: lot.lotNumber, note: 'Lote eliminado', user: req.user?.email
  });
  await lot.deleteOne();
  res.json({ message: 'Lote eliminado' });
}));

module.exports = router;
