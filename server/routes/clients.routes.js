const router = require('express').Router();
const Client = require('../models/Client');
const v = require('../utils/validators');
const { asyncHandler, httpError } = require('../utils/asyncHandler');

/** Normaliza y valida los datos de un cliente. `partial` permite actualizar solo algunos campos. */
const parse = (body, current = {}) => {
  const merged = { ...current, ...body };
  const data = {
    personType: merged.personType === 'juridica' ? 'juridica' : 'natural',
    name: String(merged.name || '').trim().replace(/\s+/g, ' '),
    documentType: merged.documentType || 'CC',
    document: v.cleanDocument(merged.documentType || 'CC', merged.document),
    email: String(merged.email || '').trim().toLowerCase() || undefined,
    phone: v.cleanPhone(merged.phone),
    address: String(merged.address || '').trim() || undefined,
    city: String(merged.city || '').trim() || undefined,
    status: merged.status === undefined ? true : Boolean(merged.status)
  };
  if (data.documentType === 'NIT') data.personType = 'juridica';
  const errors = [];
  if (data.name.length < 3) errors.push('Escribe el nombre o razón social (mínimo 3 caracteres)');
  const docErr = v.validateDocument(data.documentType, data.document);
  if (docErr) errors.push(docErr);
  const phoneErr = v.validatePhone(data.phone);
  if (phoneErr) errors.push(phoneErr);
  const emailErr = v.validateEmail(data.email);
  if (emailErr) errors.push(emailErr);
  if (errors.length) throw httpError(400, errors.join('. '));
  data.checkDigit = data.documentType === 'NIT' ? v.nitCheckDigit(data.document) : undefined;
  return data;
};

const checkDuplicates = async ({ email, document }, excludeId) => {
  const notSelf = excludeId ? { _id: { $ne: excludeId } } : {};
  if (document && (await Client.findOne({ document, ...notSelf }))) {
    throw httpError(400, 'Ya existe un cliente con ese número de documento');
  }
  if (email && (await Client.findOne({ email, ...notSelf }))) {
    throw httpError(400, 'Ya existe un cliente con ese correo');
  }
};

router.get('/', asyncHandler(async (req, res) => {
  res.json(await Client.find({ isFinalConsumer: { $ne: true } }).sort({ createdAt: -1 }));
}));

/** Cliente genérico "Consumidor final" (documento 222222222222) para ventas sin identificar al comprador. */
router.get('/final-consumer', asyncHandler(async (req, res) => {
  let client = await Client.findOne({ isFinalConsumer: true });
  if (!client) {
    client = await Client.create({
      name: 'Consumidor final',
      documentType: 'CC',
      document: v.FINAL_CONSUMER_DOCUMENT,
      phone: '0000000000',
      isFinalConsumer: true
    });
  }
  res.json(client);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw httpError(404, 'Cliente no encontrado');
  res.json(client);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = parse(req.body);
  await checkDuplicates(data);
  res.status(201).json(await Client.create(data));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const current = await Client.findById(req.params.id);
  if (!current) throw httpError(404, 'Cliente no encontrado');
  if (current.isFinalConsumer) throw httpError(400, 'El cliente "Consumidor final" no se puede modificar');
  const data = parse(req.body, current.toObject());
  await checkDuplicates(data, req.params.id);
  Object.assign(current, data);
  if (!data.email) current.email = undefined;
  await current.save();
  res.json(current);
}));

// Los clientes no se eliminan: sus ventas y facturas deben conservar la referencia. Se desactivan.
router.delete('/:id', (req, res) =>
  res.status(405).json({ message: 'Los clientes no se eliminan. Márcalo como inactivo para conservar su historial.' })
);

module.exports = router;
