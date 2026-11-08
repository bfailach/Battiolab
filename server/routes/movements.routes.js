const router = require('express').Router();
const StockMovement = require('../models/StockMovement');
const { asyncHandler } = require('../utils/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const movements = await StockMovement.find().sort({ createdAt: -1 }).limit(limit)
    .populate('product', 'name sku').lean();
  res.json(movements.map((m) => ({
    id: m._id.toString(),
    product: m.product ? { id: m.product._id.toString(), name: m.product.name, sku: m.product.sku } : null,
    type: m.type, quantity: m.quantity, stockAfter: m.stockAfter, reason: m.reason,
    reference: m.reference, note: m.note, user: m.user, createdAt: m.createdAt
  })));
}));

module.exports = router;
