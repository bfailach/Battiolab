const router = require('express').Router();
const Setting = require('../models/Setting');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler, httpError } = require('../utils/asyncHandler');

const validate = (key, value) => {
  const out = {};
  const defaults = Setting.DEFAULTS[key];
  for (const [k, def] of Object.entries(defaults)) {
    if (value[k] === undefined) continue;
    const v = value[k];
    if (Array.isArray(def)) {
      if (!Array.isArray(v)) throw httpError(400, `${k} debe ser una lista`);
      out[k] = [...new Set(v.map((x) => String(x).trim()).filter(Boolean))];
    } else if (typeof def === 'number') {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) throw httpError(400, `${k} debe ser un número positivo`);
      out[k] = n;
    } else if (typeof def === 'boolean') {
      out[k] = Boolean(v);
    } else {
      out[k] = String(v);
    }
  }
  if (key === 'sales' && out.taxRate !== undefined && out.taxRate > 100) throw httpError(400, 'El impuesto no puede superar 100%');
  return out;
};

router.get('/:key', asyncHandler(async (req, res) => {
  if (!Setting.DEFAULTS[req.params.key]) throw httpError(404, 'Configuración no encontrada');
  res.json(await Setting.get(req.params.key));
}));

router.put('/:key', requireAdmin, asyncHandler(async (req, res) => {
  const { key } = req.params;
  if (!Setting.DEFAULTS[key]) throw httpError(404, 'Configuración no encontrada');
  const current = await Setting.get(key);
  const value = { ...current, ...validate(key, req.body || {}) };
  await Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
  res.json(value);
}));

module.exports = router;
