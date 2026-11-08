const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { httpError } = require('../utils/asyncHandler');

/**
 * Cambia el stock de un producto de forma atómica y registra el movimiento.
 * delta > 0 suma unidades, delta < 0 las descuenta.
 * Si allowNegative es false y no hay unidades suficientes, lanza un error 400.
 */
const changeStock = async ({ productId, delta, reason, reference, note, user, allowNegative = false }) => {
  if (!delta) return Product.findById(productId);
  const filter = { _id: productId };
  if (delta < 0 && !allowNegative) filter.stock = { $gte: -delta };

  const product = await Product.findOneAndUpdate(filter, { $inc: { stock: delta } }, { new: true });
  if (!product) {
    const exists = await Product.findById(productId).lean();
    if (!exists) throw httpError(404, 'Producto no encontrado');
    throw httpError(400, `Stock insuficiente para "${exists.name}": quedan ${exists.stock} unidades`);
  }

  await StockMovement.create({
    product: product._id,
    type: delta > 0 ? 'in' : 'out',
    quantity: Math.abs(delta),
    stockAfter: product.stock,
    reason,
    reference,
    note,
    user
  });
  return product;
};

/** Fija el stock a un valor exacto (ajuste de inventario) y registra la diferencia. */
const setStock = async ({ productId, stock, note, user }) => {
  const before = await Product.findById(productId);
  if (!before) throw httpError(404, 'Producto no encontrado');
  if (typeof stock !== 'number' || stock < 0 || !Number.isFinite(stock)) {
    throw httpError(400, 'El stock debe ser un número no negativo');
  }
  const diff = stock - before.stock;
  before.stock = stock;
  await before.save();
  if (diff !== 0) {
    await StockMovement.create({
      product: before._id,
      type: 'adjust',
      quantity: diff,
      stockAfter: stock,
      reason: 'manual',
      note,
      user
    });
  }
  return before;
};

/**
 * Descuenta (o repone, con sign = +1) las unidades de todos los ítems de una venta.
 * Si una línea falla, revierte las ya aplicadas para no dejar el inventario a medias.
 */
const applySaleItems = async ({ items, sign, reason, reference, user, allowNegative }) => {
  const applied = [];
  try {
    for (const item of items) {
      await changeStock({
        productId: item.productId,
        delta: sign * item.quantity,
        reason,
        reference,
        user,
        allowNegative: sign > 0 ? true : allowNegative
      });
      applied.push(item);
    }
  } catch (error) {
    for (const item of applied) {
      await changeStock({
        productId: item.productId,
        delta: -sign * item.quantity,
        reason: 'manual',
        reference,
        note: 'Reversión automática',
        user,
        allowNegative: true
      });
    }
    throw error;
  }
};

module.exports = { changeStock, setStock, applySaleItems };
