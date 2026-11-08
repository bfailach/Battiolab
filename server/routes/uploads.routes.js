const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { asyncHandler, httpError } = require('../utils/asyncHandler');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 3 * 1024 * 1024;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/**
 * Recibe una imagen como data URL (la app la reduce antes de enviarla) y la guarda en disco.
 * Devuelve la ruta pública relativa, p. ej. /uploads/abc.webp
 */
router.post('/', asyncHandler(async (req, res) => {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(req.body.dataUrl || ''));
  if (!match) throw httpError(400, 'Sube una imagen JPG, PNG o WebP');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > MAX_BYTES) throw httpError(400, 'La imagen pesa más de 3 MB');
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${TYPES[match[1]]}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, name), buffer);
  res.status(201).json({ url: `/uploads/${name}` });
}));

module.exports = { router, UPLOAD_DIR };
