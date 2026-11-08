const router = require('express').Router();
const Employee = require('../models/Employee');
const Setting = require('../models/Setting');
const v = require('../utils/validators');
const { asyncHandler, httpError } = require('../utils/asyncHandler');

const parse = async (body, current = {}) => {
  const m = { ...current, ...body };
  const data = {
    name: String(m.name || '').trim().replace(/\s+/g, ' '),
    documentType: m.documentType || 'CC',
    document: v.cleanDocument(m.documentType || 'CC', m.document),
    email: String(m.email || '').trim().toLowerCase(),
    phone: v.cleanPhone(m.phone),
    position: String(m.position || '').trim(),
    department: String(m.department || '').trim(),
    hireDate: m.hireDate ? new Date(m.hireDate) : null,
    salary: v.toMoney(m.salary),
    status: m.status === undefined ? true : Boolean(m.status)
  };
  const errors = [];
  if (data.name.length < 3) errors.push('Escribe el nombre completo');
  if (!data.document) errors.push('Escribe el número de documento');
  else {
    const e = v.validateDocument(data.documentType, data.document);
    if (e) errors.push(e);
  }
  const ee = v.validateEmail(data.email, true);
  if (ee) errors.push(ee);
  const pe = v.validatePhone(data.phone);
  if (pe) errors.push(pe);
  if (!data.position) errors.push('Indica el cargo');
  if (!data.department) errors.push('Indica el departamento');
  if (!data.hireDate || Number.isNaN(data.hireDate.getTime())) errors.push('Indica la fecha de contratación');
  else if (data.hireDate > new Date(Date.now() + 90 * 86400000)) errors.push('La fecha de contratación no puede estar a más de 90 días en el futuro');
  if (!Number.isFinite(data.salary) || data.salary <= 0) errors.push('El salario debe ser mayor a 0');
  if (errors.length) throw httpError(400, errors.join('. '));

  // Salario por debajo del mínimo: se permite solo para contratos de medio tiempo, por eso es advertencia en la UI.
  const company = await Setting.get('company');
  data.belowMinimumWage = company.minimumWage && data.salary < company.minimumWage;
  return data;
};

const checkDuplicates = async ({ email, document }, excludeId) => {
  const notSelf = excludeId ? { _id: { $ne: excludeId } } : {};
  if (await Employee.findOne({ email, ...notSelf })) throw httpError(400, 'Ya existe un empleado con ese correo');
  if (document && (await Employee.findOne({ document, ...notSelf }))) {
    throw httpError(400, 'Ya existe un empleado con ese número de documento');
  }
};

router.get('/', asyncHandler(async (req, res) => {
  res.json(await Employee.find().sort({ createdAt: -1 }));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw httpError(404, 'Empleado no encontrado');
  res.json(employee);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { belowMinimumWage, ...data } = await parse(req.body);
  await checkDuplicates(data);
  const employee = await Employee.create(data);
  res.status(201).json({ ...employee.toObject(), belowMinimumWage });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const current = await Employee.findById(req.params.id);
  if (!current) throw httpError(404, 'Empleado no encontrado');
  const { belowMinimumWage, ...data } = await parse(req.body, current.toObject());
  await checkDuplicates(data, req.params.id);
  // Reactivar a alguien borra la fecha de retiro
  if (data.status && !current.status) {
    data.terminationDate = null;
    data.terminationReason = undefined;
  }
  Object.assign(current, data);
  await current.save();
  res.json({ ...current.toObject(), belowMinimumWage });
}));

/** Registrar el retiro: el empleado queda inactivo con fecha y motivo, y su historial se conserva. */
router.post('/:id/terminate', asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw httpError(404, 'Empleado no encontrado');
  const date = req.body.date ? new Date(req.body.date) : new Date();
  if (Number.isNaN(date.getTime())) throw httpError(400, 'La fecha de retiro no es válida');
  if (date < employee.hireDate) throw httpError(400, 'La fecha de retiro no puede ser anterior a la contratación');
  employee.status = false;
  employee.terminationDate = date;
  employee.terminationReason = String(req.body.reason || '').trim() || undefined;
  await employee.save();
  res.json(employee);
}));

router.delete('/:id', (req, res) =>
  res.status(405).json({ message: 'Los empleados no se eliminan. Registra su retiro para conservar el historial laboral.' })
);

module.exports = router;
