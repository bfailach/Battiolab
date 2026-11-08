/* eslint-disable @typescript-eslint/no-var-requires */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../server/app');
const { requireAdmin, signToken } = require('../server/middleware/auth');
const { asyncHandler, httpError } = require('../server/utils/asyncHandler');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('API sin base de datos', () => {
  test('health responde ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test.each(['/api/clients', '/api/products', '/api/employees', '/api/sales', '/api/lots', '/api/settings/sales', '/api/movements'])(
    '%s exige token',
    async (path) => {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    }
  );

  test('rechaza tokens inválidos', async () => {
    const res = await request(app).get('/api/clients').set('Authorization', 'Bearer no-es-un-token');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/sesión/i);
  });

  test('responde 400 ante JSON mal formado', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(res.status).toBe(400);
  });

  test('rutas desconocidas devuelven 404 en JSON', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.message).toBeDefined();
  });
});

describe('middleware', () => {
  test('requireAdmin bloquea a usuarios normales', () => {
    const res = mockRes();
    const next = jest.fn();
    requireAdmin({ user: { role: 'user' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAdmin deja pasar a administradores', () => {
    const next = jest.fn();
    requireAdmin({ user: { role: 'admin' } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('signToken genera un token válido con el rol', () => {
    const jwt = require('../server/node_modules/jsonwebtoken');
    const token = signToken({ _id: 'abc', email: 'a@b.co', role: 'admin' });
    expect(jwt.verify(token, 'test-secret')).toMatchObject({ email: 'a@b.co', role: 'admin' });
  });

  test('asyncHandler traduce httpError, CastError y duplicados', async () => {
    const cases = [
      [httpError(418, 'tetera'), 418],
      [Object.assign(new Error('x'), { name: 'CastError' }), 400],
      [Object.assign(new Error('x'), { code: 11000, keyValue: { email: 'a' } }), 400]
    ];
    for (const [err, status] of cases) {
      const res = mockRes();
      await asyncHandler(async () => {
        throw err;
      })({}, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(status);
    }
  });
});
