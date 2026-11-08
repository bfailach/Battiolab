const router = require('express').Router();
const User = require('../models/User');
const { requireAuth, signToken } = require('../middleware/auth');
const { asyncHandler, httpError } = require('../utils/asyncHandler');

const publicUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name || user.username,
  role: user.role,
  siteCode: user.siteCode
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const siteCode = String(req.body.siteCode || '').trim();
    const name = req.body.name ? String(req.body.name).trim() : undefined;

    if (!email || !password || !siteCode) throw httpError(400, 'Completa correo, contraseña y código de sede');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw httpError(400, 'El correo no tiene un formato válido');
    if (password.length < 6) throw httpError(400, 'La contraseña debe tener al menos 6 caracteres');
    if (process.env.SITE_CODE && siteCode !== process.env.SITE_CODE) {
      throw httpError(400, 'El código de sede no es válido');
    }
    if (await User.findOne({ email })) throw httpError(400, 'Ya existe una cuenta con ese correo');

    // La primera cuenta creada administra el sistema; las siguientes son usuarios normales
    const isFirst = (await User.estimatedDocumentCount()) === 0;
    const user = await User.create({
      email,
      name,
      username: email.split('@')[0],
      password,
      siteCode,
      role: isFirst ? 'admin' : 'user'
    });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) throw httpError(400, 'Ingresa tu correo y contraseña');

    const user = await User.findOne({ email });
    // Mismo mensaje en ambos casos para no revelar qué cuentas existen
    if (!user || !(await user.comparePassword(password))) {
      throw httpError(400, 'Correo o contraseña incorrectos');
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) throw httpError(401, 'La cuenta ya no existe');
    res.json(publicUser(user));
  })
);

module.exports = router;
