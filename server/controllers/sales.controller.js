const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Client = require('../models/Client');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const { applySaleItems } = require('../services/stock');
const { asyncHandler, httpError } = require('../utils/asyncHandler');

const DAY = 86400000;

/** Agrupa el IVA por tarifa, como exige la factura (IVA discriminado). */
const taxBreakdown = (items) => {
  const map = new Map();
  items.forEach((i) => {
    const b = map.get(i.taxRate) || { rate: i.taxRate, base: 0, amount: 0 };
    b.base += i.subtotal;
    b.amount += i.taxAmount;
    map.set(i.taxRate, b);
  });
  return [...map.values()].sort((a, b) => b.rate - a.rate);
};

/** Da a la venta la forma que espera el frontend, completando datos de ventas antiguas. */
const toDTO = (sale) => {
  const ref = sale.client?.id;
  const populated = ref && typeof ref === 'object' && ref.name !== undefined;
  const snapshot = sale.customer && sale.customer.name ? sale.customer : null;
  const items = (sale.items || []).map((item) => {
    const p = item.productId;
    const isPop = p && typeof p === 'object' && p.name !== undefined;
    const taxRate = item.taxRate ?? sale.taxRate ?? 0;
    const taxAmount = item.taxAmount ?? Math.round((item.subtotal * taxRate) / 100);
    return {
      productId: isPop ? p._id.toString() : p ? p.toString() : null,
      productName: item.productName || (isPop ? p.name : null) || 'Producto eliminado',
      sku: item.sku || (isPop ? p.sku : '') || '',
      unit: item.unit || 'UND',
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      taxRate,
      taxAmount,
      total: item.total || item.subtotal + taxAmount
    };
  });
  return {
    id: sale._id.toString(),
    number: sale.number || null,
    client: {
      id: populated ? ref._id.toString() : ref ? ref.toString() : null,
      name: snapshot?.name || (populated ? ref.name : null) || sale.client?.name || 'Cliente eliminado',
      email: populated ? ref.email : undefined,
      phone: populated ? ref.phone : undefined
    },
    customer: snapshot || {
      name: (populated ? ref.name : null) || sale.client?.name,
      documentType: populated ? ref.documentType || 'CC' : undefined,
      document: populated ? ref.document : undefined,
      checkDigit: populated ? ref.checkDigit : undefined,
      email: populated ? ref.email : undefined,
      phone: populated ? ref.phone : undefined,
      address: populated ? ref.address : undefined,
      city: populated ? ref.city : undefined
    },
    items,
    subtotal: sale.subtotal ?? items.reduce((s, i) => s + i.subtotal, 0),
    taxes: sale.taxes?.length ? sale.taxes : taxBreakdown(items).filter((t) => t.amount > 0),
    taxAmount: sale.taxAmount || 0,
    total: sale.total,
    paymentForm: sale.paymentForm || (sale.status === 'pending' ? 'credito' : 'contado'),
    paymentMethod: sale.paymentMethod || null,
    dueDate: sale.dueDate || null,
    paidAt: sale.paidAt || null,
    notes: sale.notes || '',
    status: sale.status,
    creditNote: sale.creditNote?.number ? sale.creditNote : null,
    date: (sale.date || sale.createdAt || new Date()).toISOString(),
    createdBy: sale.createdBy,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt
  };
};

const populateSale = (query) =>
  query.populate('items.productId', 'name price sku').populate('client.id', 'name email phone documentType document checkDigit address city');

/** Valida cliente y productos y calcula subtotales e IVA por línea en el servidor. */
const buildSaleData = async (body, settings) => {
  const clientId = body.client?.id || body.clientId;
  if (!clientId || !mongoose.isValidObjectId(clientId)) throw httpError(400, 'Selecciona un cliente válido');
  const client = await Client.findById(clientId).lean();
  if (!client) throw httpError(400, 'El cliente seleccionado no existe');
  if (!client.status) throw httpError(400, 'El cliente está inactivo. Actívalo antes de venderle');

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0) throw httpError(400, 'Agrega al menos un producto a la venta');

  const merged = new Map();
  for (const item of rawItems) {
    if (!mongoose.isValidObjectId(item.productId)) throw httpError(400, 'Hay un producto no válido en la venta');
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1) throw httpError(400, 'Las cantidades deben ser números enteros mayores a 0');
    const prev = merged.get(item.productId);
    merged.set(item.productId, { productId: item.productId, quantity: (prev?.quantity || 0) + qty, price: item.price });
  }

  const products = await Product.find({ _id: { $in: [...merged.keys()] } }).lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));
  const items = [...merged.values()].map((item) => {
    const product = byId.get(item.productId);
    if (!product) throw httpError(400, 'Uno de los productos ya no existe');
    if (product.status === 'discontinued') throw httpError(400, `"${product.name}" está descontinuado y no se puede vender`);
    const price = item.price !== undefined && item.price !== null && item.price !== '' ? Math.round(Number(item.price)) : product.price;
    if (!Number.isFinite(price) || price < 0) throw httpError(400, 'Los precios deben ser valores positivos');
    const taxRate = product.taxRate ?? 19;
    let subtotal;
    let taxAmount;
    if (product.priceIncludesTax) {
      // Precio al público con IVA incluido: se desagrega la base para que el total quede exacto
      const total = price * item.quantity;
      subtotal = Math.round(total / (1 + taxRate / 100));
      taxAmount = total - subtotal;
    } else {
      subtotal = price * item.quantity;
      taxAmount = Math.round((subtotal * taxRate) / 100);
    }
    return {
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      unit: product.unit || 'UND',
      quantity: item.quantity,
      price: Math.round((subtotal / item.quantity) * 100) / 100, // valor unitario antes de IVA
      subtotal,
      taxRate,
      taxAmount,
      total: subtotal + taxAmount
    };
  });

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const taxAmount = items.reduce((s, i) => s + i.taxAmount, 0);
  const date = body.date ? new Date(body.date) : new Date();
  const paymentForm = body.paymentForm === 'credito' ? 'credito' : 'contado';
  const creditDays = Number(body.creditDays ?? settings.defaultCreditDays ?? 30);
  if (paymentForm === 'credito' && client.isFinalConsumer) {
    throw httpError(400, 'Las ventas a crédito requieren un cliente identificado');
  }
  if (paymentForm === 'contado' && !body.paymentMethod) throw httpError(400, 'Indica el medio de pago');

  return {
    client: { id: client._id, name: client.name },
    customer: {
      name: client.name,
      documentType: client.documentType || 'CC',
      document: client.document,
      checkDigit: client.checkDigit,
      email: client.email,
      phone: client.isFinalConsumer ? undefined : client.phone,
      address: client.address,
      city: client.city
    },
    items,
    subtotal,
    taxes: taxBreakdown(items),
    taxAmount,
    total: subtotal + taxAmount,
    paymentForm,
    paymentMethod: paymentForm === 'contado' ? body.paymentMethod : undefined,
    dueDate: paymentForm === 'credito' ? new Date(date.getTime() + Math.max(1, creditDays) * DAY) : undefined,
    paidAt: paymentForm === 'contado' ? date : undefined,
    notes: String(body.notes || '').trim() || undefined,
    status: paymentForm === 'contado' ? 'completed' : 'pending',
    date
  };
};

/**
 * Siguiente número de factura. Con resolución DIAN configurada usa su prefijo y rango
 * y se niega a facturar fuera de él o con la resolución vencida.
 */
const nextNumber = async (company, settings) => {
  const last = await Sale.findOne({ sequence: { $exists: true } }).sort({ sequence: -1 }).select('sequence').lean();
  const hasResolution = Boolean(company.resolutionNumber && company.resolutionTo);
  if (hasResolution) {
    const from = Number(company.resolutionFrom) || 1;
    const to = Number(company.resolutionTo);
    const sequence = Math.max(from, (last?.sequence || 0) + 1);
    if (sequence > to) {
      throw httpError(409, `Se agotó el rango de numeración autorizado (${from} a ${to}). Solicita una nueva resolución a la DIAN y regístrala en Empresa.`);
    }
    if (company.resolutionValidUntil && new Date(`${company.resolutionValidUntil}T23:59:59`) < new Date()) {
      throw httpError(409, 'La resolución de facturación está vencida. Registra la nueva resolución en Empresa.');
    }
    return { sequence, number: `${company.resolutionPrefix || ''}${sequence}` };
  }
  // Sin resolución: numeración interna consecutiva
  const legacy = await Sale.countDocuments();
  const sequence = Math.max((last?.sequence || 0) + 1, legacy + 1);
  return { sequence, number: `${settings.invoicePrefix || ''}${String(sequence).padStart(5, '0')}` };
};

/** Recalcula compras acumuladas del cliente a partir de sus ventas no anuladas. */
const refreshClientStats = async (clientId) => {
  if (!clientId) return;
  const sales = await Sale.find({ 'client.id': clientId, status: { $ne: 'cancelled' } }, 'total date').lean();
  const stats = sales.reduce(
    (acc, s) => ({ total: acc.total + (s.total || 0), last: !acc.last || s.date > acc.last ? s.date : acc.last }),
    { total: 0, last: null }
  );
  await Client.findByIdAndUpdate(clientId, { totalPurchases: sales.length, totalSpent: stats.total, lastPurchase: stats.last });
};

const sendSale = async (res, id, status = 200) => {
  const full = await populateSale(Sale.findById(id)).lean();
  res.status(status).json(toDTO(full));
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
  const [settings, company] = await Promise.all([Setting.get('sales'), Setting.get('company')]);
  const data = await buildSaleData(req.body, settings);
  const { number, sequence } = await nextNumber(company, settings);
  const user = req.user?.email;

  await applySaleItems({ items: data.items, sign: -1, reason: 'sale', reference: number, user, allowNegative: settings.allowNegativeStock });
  let sale;
  try {
    sale = await Sale.create({ ...data, number, sequence, stockApplied: true, createdBy: user });
  } catch (error) {
    await applySaleItems({ items: data.items, sign: 1, reason: 'manual', reference: number, user });
    throw error;
  }
  await refreshClientStats(data.client.id);
  await sendSale(res, sale._id, 201);
});

/** Una factura emitida no se modifica: solo se pueden cambiar las observaciones internas. */
const updateSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) throw httpError(404, 'Venta no encontrada');
  const forbidden = ['items', 'client', 'total', 'status', 'date'].filter((k) => req.body[k] !== undefined);
  if (forbidden.length) {
    throw httpError(400, 'Una factura emitida no se puede modificar. Para corregirla, anúlala con nota crédito y emite una nueva.');
  }
  if (req.body.notes !== undefined) sale.notes = String(req.body.notes).trim() || undefined;
  await sale.save();
  await sendSale(res, sale._id);
});

/** Registrar el pago de una venta a crédito. */
const paySale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) throw httpError(404, 'Venta no encontrada');
  if (sale.status !== 'pending') throw httpError(400, 'Solo se pueden registrar pagos de ventas por cobrar');
  if (!req.body.paymentMethod) throw httpError(400, 'Indica el medio de pago');
  sale.status = 'completed';
  sale.paymentMethod = req.body.paymentMethod;
  sale.paidAt = req.body.date ? new Date(req.body.date) : new Date();
  await sale.save();
  await sendSale(res, sale._id);
});

/** Anular con nota crédito: repone el inventario y deja el motivo y el consecutivo de la nota. */
const cancelSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id);
  if (!sale) throw httpError(404, 'Venta no encontrada');
  if (sale.status === 'cancelled') throw httpError(400, 'La venta ya está anulada');
  const reason = String(req.body.reason || '').trim();
  if (reason.length < 5) throw httpError(400, 'Explica el motivo de la anulación (mínimo 5 caracteres)');
  const settings = await Setting.get('sales');
  const count = await Sale.countDocuments({ 'creditNote.number': { $exists: true } });
  const creditNumber = `${settings.creditNotePrefix || 'NC-'}${String(count + 1).padStart(5, '0')}`;
  if (sale.stockApplied) {
    await applySaleItems({
      items: sale.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      sign: 1,
      reason: 'sale_cancelled',
      reference: creditNumber,
      user: req.user?.email
    });
  }
  sale.status = 'cancelled';
  sale.stockApplied = false;
  sale.creditNote = { number: creditNumber, date: new Date(), reason, user: req.user?.email };
  await sale.save();
  await refreshClientStats(sale.client.id);
  await sendSale(res, sale._id);
});

const deleteSale = (req, res) =>
  res.status(405).json({ message: 'Las facturas no se eliminan. Anúlala con nota crédito para conservar el consecutivo.' });

module.exports = { getSales, getSaleById, createSale, updateSale, paySale, cancelSale, deleteSale, toDTO };
