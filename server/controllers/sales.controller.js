const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const { applySaleItems } = require('../services/stock');
const { asyncHandler, httpError } = require('../utils/asyncHandler');

const round = (n) => Math.round(n * 100) / 100;

/** Da a la venta la forma que espera el frontend. */
const toDTO = (sale) => {
  const clientRef = sale.client?.id;
  const populated = clientRef && typeof clientRef === 'object' && clientRef.name !== undefined;
  return {
    id: sale._id.toString(),
    number: sale.number || null,
    client: {
      id: populated ? clientRef._id.toString() : clientRef ? clientRef.toString() : null,
      name: (populated ? clientRef.name : null) || sale.client?.name || 'Cliente eliminado',
      email: populated ? clientRef.email : undefined,
      phone: populated ? clientRef.phone : undefined
    },
    items: (sale.items || []).map((item) => {
      const p = item.productId;
      const isPop = p && typeof p === 'object' && p.name !== undefined;
      return {
        productId: isPop ? p._id.toString() : p ? p.toString() : null,
        productName: (isPop ? p.name : null) || item.productName || 'Producto eliminado',
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      };
    }),
    subtotal: sale.subtotal ?? sale.total,
    taxRate: sale.taxRate || 0,
    taxAmount: sale.taxAmount || 0,
    total: sale.total,
    paymentMethod: sale.paymentMethod || null,
    notes: sale.notes || '',
    status: sale.status,
    date: (sale.date || sale.createdAt || new Date()).toISOString(),
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt
  };
};

const populateSale = (query) =>
  query.populate('items.productId', 'name price sku').populate('client.id', 'name email phone');

/** Valida cliente y productos, y calcula subtotales e impuestos en el servidor. */
const buildSaleData = async (body, settings) => {
  const clientId = body.client?.id || body.clientId;
  if (!clientId || !mongoose.isValidObjectId(clientId)) throw httpError(400, 'Selecciona un cliente válido');
  const client = await Client.findById(clientId).lean();
  if (!client) throw httpError(400, 'El cliente seleccionado no existe');

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0) throw httpError(400, 'Agrega al menos un producto a la venta');

  const merged = new Map();
  for (const item of rawItems) {
    if (!mongoose.isValidObjectId(item.productId)) throw httpError(400, 'Hay un producto no válido en la venta');
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1) throw httpError(400, 'Las cantidades deben ser números enteros mayores a 0');
    const prev = merged.get(item.productId);
    merged.set(item.productId, {
      productId: item.productId,
      quantity: (prev?.quantity || 0) + qty,
      price: item.price
    });
  }

  const products = await Product.find({ _id: { $in: [...merged.keys()] } }).lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));
  const items = [...merged.values()].map((item) => {
    const product = byId.get(item.productId);
    if (!product) throw httpError(400, 'Uno de los productos ya no existe');
    const price = item.price !== undefined && item.price !== null && item.price !== '' ? Number(item.price) : product.price;
    if (!Number.isFinite(price) || price < 0) throw httpError(400, 'Los precios deben ser valores positivos');
    return {
      productId: product._id,
      productName: product.name,
      quantity: item.quantity,
      price,
      subtotal: round(price * item.quantity)
    };
  });

  const subtotal = round(items.reduce((sum, i) => sum + i.subtotal, 0));
  const taxRate = body.taxRate !== undefined ? Number(body.taxRate) : settings.taxRate;
  const taxAmount = round((subtotal * (taxRate || 0)) / 100);

  return {
    client: { id: client._id, name: client.name },
    items,
    subtotal,
    taxRate: taxRate || 0,
    taxAmount,
    total: round(subtotal + taxAmount),
    paymentMethod: body.paymentMethod || undefined,
    notes: body.notes || undefined,
    status: ['completed', 'pending', 'cancelled'].includes(body.status) ? body.status : settings.defaultStatus,
    date: body.date ? new Date(body.date) : new Date()
  };
};

const nextNumber = async (prefix) => {
  // Toma el consecutivo más alto existente para no repetir números aunque se borren ventas
  const recent = await Sale.find({ number: { $exists: true } }, 'number').sort({ createdAt: -1 }).limit(50).lean();
  const max = recent.reduce((m, s) => Math.max(m, Number((s.number || '').match(/(\d+)$/)?.[1] || 0)), 0);
  const count = await Sale.countDocuments();
  return `${prefix}${String(Math.max(max, count) + 1).padStart(5, '0')}`;
};

/** Recalcula las compras acumuladas del cliente a partir de sus ventas no canceladas. */
const refreshClientStats = async (clientId) => {
  if (!clientId) return;
  const sales = await Sale.find({ 'client.id': clientId, status: { $ne: 'cancelled' } }, 'total date').lean();
  const stats = sales.reduce(
    (acc, s) => ({ total: acc.total + (s.total || 0), last: !acc.last || s.date > acc.last ? s.date : acc.last }),
    { total: 0, last: null }
  );
  await Client.findByIdAndUpdate(clientId, {
    totalPurchases: sales.length,
    totalSpent: stats.total,
    lastPurchase: stats.last
  });
};

const getSales = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.clientId && mongoose.isValidObjectId(req.query.clientId)) filter['client.id'] = req.query.clientId;
  if (req.query.status) filter.status = req.query.status;
  const sales = await populateSale(Sale.find(filter).sort({ date: -1 })).lean();
  res.json(sales.map(toDTO));
});

const getSaleById = asyncHandler(async (req, res) => {
  const sale = await populateSale(Sale.findById(req.params.id)).lean();
  if (!sale) throw httpError(404, 'Venta no encontrada');
  res.json(toDTO(sale));
});

const createSale = asyncHandler(async (req, res) => {
  const settings = await Setting.get('sales');
  const data = await buildSaleData(req.body, settings);
  const number = await nextNumber(settings.invoicePrefix || '');
  const user = req.user?.email;

  const applyStock = data.status !== 'cancelled';
  if (applyStock) {
    await applySaleItems({
      items: data.items,
      sign: -1,
      reason: 'sale',
      reference: number,
      user,
      allowNegative: settings.allowNegativeStock
    });
  }

  let sale;
  try {
    sale = await Sale.create({ ...data, number, stockApplied: applyStock, createdBy: user });
  } catch (error) {
    if (applyStock) {
      await applySaleItems({ items: data.items, sign: 1, reason: 'manual', reference: number, user });
    }
    throw error;
  }
  await refreshClientStats(data.client.id);
  const full = await populateSale(Sale.findById(sale._id)).lean();
  res.status(201).json(toDTO(full));
});

const updateSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) throw httpError(404, 'Venta no encontrada');
  const settings = await Setting.get('sales');
  const user = req.user?.email;
  const reference = sale.number || sale._id.toString();

  const contentChanged = req.body.items !== undefined || req.body.client !== undefined;
  const next = contentChanged
    ? await buildSaleData(
        {
          client: req.body.client || { id: sale.client.id },
          items: req.body.items || sale.items.map((i) => ({ productId: i.productId.toString(), quantity: i.quantity, price: i.price })),
          taxRate: req.body.taxRate ?? sale.taxRate,
          paymentMethod: req.body.paymentMethod ?? sale.paymentMethod,
          notes: req.body.notes ?? sale.notes,
          status: req.body.status ?? sale.status,
          date: req.body.date ?? sale.date
        },
        settings
      )
    : null;

  const nextStatus = req.body.status ?? sale.status;
  const shouldApply = nextStatus !== 'cancelled';
  const oldItems = sale.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
  const newItems = (next ? next.items : sale.items).map((i) => ({ productId: i.productId, quantity: i.quantity }));

  // Devolver lo que se había descontado y volver a descontar según el nuevo estado
  if (sale.stockApplied) {
    await applySaleItems({ items: oldItems, sign: 1, reason: 'sale_cancelled', reference, user });
  }
  if (shouldApply) {
    try {
      await applySaleItems({
        items: newItems,
        sign: -1,
        reason: 'sale',
        reference,
        user,
        allowNegative: settings.allowNegativeStock
      });
    } catch (error) {
      if (sale.stockApplied) {
        await applySaleItems({ items: oldItems, sign: -1, reason: 'sale', reference, user, allowNegative: true });
      }
      throw error;
    }
  }

  if (next) Object.assign(sale, next);
  if (req.body.paymentMethod !== undefined) sale.paymentMethod = req.body.paymentMethod;
  if (req.body.notes !== undefined) sale.notes = req.body.notes;
  sale.status = nextStatus;
  sale.stockApplied = shouldApply;
  await sale.save();

  await refreshClientStats(sale.client.id);
  const full = await populateSale(Sale.findById(sale._id)).lean();
  res.json(toDTO(full));
});

const deleteSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) throw httpError(404, 'Venta no encontrada');
  if (sale.stockApplied) {
    await applySaleItems({
      items: sale.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      sign: 1,
      reason: 'sale_cancelled',
      reference: sale.number || sale._id.toString(),
      user: req.user?.email
    });
  }
  await sale.deleteOne();
  await refreshClientStats(sale.client.id);
  res.json({ message: 'Venta eliminada' });
});

module.exports = { getSales, getSaleById, createSale, updateSale, deleteSale };
