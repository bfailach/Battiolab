const router = require('express').Router();
const Employee = require('../models/Employee');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler, httpError } = require('../utils/asyncHandler');

const FIELDS = ['name', 'email', 'phone', 'position', 'department', 'status', 'hireDate', 'salary'];
const pick = (body) => Object.fromEntries(FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

router.get('/', asyncHandler(async (req, res) => {
  res.json(await Employee.find().sort({ createdAt: -1 }));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw httpError(404, 'Empleado no encontrado');
  res.json(employee);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = pick(req.body);
  if (data.email && (await Employee.findOne({ email: String(data.email).toLowerCase() }))) {
    throw httpError(400, 'Ya existe un empleado con ese email');
  }
  res.status(201).json(await Employee.create(data));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const data = pick(req.body);
  if (data.email && (await Employee.findOne({ email: String(data.email).toLowerCase(), _id: { $ne: req.params.id } }))) {
    throw httpError(400, 'Ya existe un empleado con ese email');
  }
  const updated = await Employee.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!updated) throw httpError(404, 'Empleado no encontrado');
  res.json(updated);
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const deleted = await Employee.findByIdAndDelete(req.params.id);
  if (!deleted) throw httpError(404, 'Empleado no encontrado');
  res.json({ message: 'Empleado eliminado' });
}));

module.exports = router;
