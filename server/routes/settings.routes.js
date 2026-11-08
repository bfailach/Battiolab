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
      const n = v === '' ? 0 : Number(v);
      if (!Number.isFinite(n) || n < 0) throw httpError(400, `${k} debe ser un número positivo`);
      out[k] = n;
    } else if (typeof def === 'boolean') {
      out[k] = Boolean(v);
    } else {
      out[k] = String(v);
    }
  }
  if (key === 'company') {
    const v = require('../utils/validators');
    if (out.nit !== undefined) {
      out.nit = out.nit.replace(/\D/g, '');
      if (out.nit && !/^\d{9}$/.test(out.nit)) throw httpError(400, 'El NIT debe tener 9 dígitos, sin el dígito de verificación');
      out.checkDigit = out.nit ? String(v.nitCheckDigit(out.nit)) : '';
    }
    if (out.phone) {
      out.phone = v.cleanPhone(out.phone);
      const e = v.validatePhone(out.phone);
      if (e) throw httpError(400, e);
    }
    if (out.email && v.validateEmail(out.email)) throw httpError(400, 'El correo de la empresa no es válido');
    if (out.resolutionPrefix !== undefined && !/^[A-Z0-9]{0,4}$/.test(out.resolutionPrefix.toUpperCase())) {
      throw httpError(400, 'El prefijo de la resolución admite hasta 4 letras o números');
    }
    if (out.resolutionPrefix) out.resolutionPrefix = out.resolutionPrefix.toUpperCase();
    const from = out.resolutionFrom ?? 0;
    const to = out.resolutionTo ?? 0;
    if (to && from > to) throw httpError(400, 'El rango de numeración es inválido: "desde" es mayor que "hasta"');
  }
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
