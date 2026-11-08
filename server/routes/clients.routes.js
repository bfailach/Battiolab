const router = require('express').Router();
const Client = require('../models/Client');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler, httpError } = require('../utils/asyncHandler');

const pick = (body) => {
  const data = {};
  ['name', 'document', 'email', 'phone'].forEach((k) => {
    if (body[k] !== undefined) data[k] = String(body[k]).trim();
  });
  if (body.status !== undefined) data.status = Boolean(body.status);
  return data;
};

const checkDuplicates = async ({ email, document }, excludeId) => {
  const notSelf = excludeId ? { _id: { $ne: excludeId } } : {};
  if (email && (await Client.findOne({ email: email.toLowerCase(), ...notSelf }))) {
    throw httpError(400, 'Ya existe un cliente con ese email');
  }
  if (document && (await Client.findOne({ document, ...notSelf }))) {
    throw httpError(400, 'Ya existe un cliente con ese documento');
  }
};

router.get('/', asyncHandler(async (req, res) => {
  res.json(await Client.find().sort({ createdAt: -1 }));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw httpError(404, 'Cliente no encontrado');
  res.json(client);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = pick(req.body);
  const missing = ['name', 'document', 'email', 'phone'].filter((k) => !data[k]);
  if (missing.length) throw httpError(400, `Faltan campos requeridos: ${missing.join(', ')}`);
  await checkDuplicates(data);
  res.status(201).json(await Client.create(data));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const data = pick(req.body);
  await checkDuplicates(data, req.params.id);
  const updated = await Client.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!updated) throw httpError(404, 'Cliente no encontrado');
  res.json(updated);
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const deleted = await Client.findByIdAndDelete(req.params.id);
  if (!deleted) throw httpError(404, 'Cliente no encontrado');
  res.json({ message: 'Cliente eliminado' });
}));

module.exports = router;
