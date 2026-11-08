/** Envuelve un handler async y traduce errores conocidos a respuestas HTTP. */
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: details.join('. '), errors: details });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El identificador no es válido' });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'campo';
      return res.status(400).json({ message: `Ya existe un registro con ese ${field}`, field });
    }
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const httpError = (status, message) => Object.assign(new Error(message), { status });

module.exports = { asyncHandler, httpError };
