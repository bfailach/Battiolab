/* eslint-disable @typescript-eslint/no-var-requires */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../server/app');
const { signToken } = require('../server/middleware/auth');
const v = require('../server/utils/validators');

describe('validaciones colombianas', () => {
  test('dígito de verificación del NIT (casos conocidos de la DIAN)', () => {
    expect(v.nitCheckDigit('800197268')).toBe(4); // DIAN
    expect(v.nitCheckDigit('900123456')).toBe(8);
    expect(v.nitCheckDigit('860002183')).toBe(9);
  });

  test('cédula de ciudadanía entre 6 y 10 dígitos', () => {
    expect(v.validateDocument('CC', '1020304050')).toBeNull();
    expect(v.validateDocument('CC', '12345')).toMatch(/6 y 10/);
    expect(v.validateDocument('CC', '12345678901')).not.toBeNull();
  });

  test('NIT de 9 dígitos y consumidor final', () => {
    expect(v.validateDocument('NIT', '900123456')).toBeNull();
    expect(v.validateDocument('NIT', '90012345')).not.toBeNull();
    expect(v.validateDocument('CC', v.FINAL_CONSUMER_DOCUMENT)).toBeNull();
  });

  test('pasaporte acepta letras y limpia caracteres', () => {
    expect(v.cleanDocument('PP', 'ab-12 345')).toBe('AB12345');
    expect(v.validateDocument('PP', 'AB12345')).toBeNull();
  });

  test('teléfonos de 10 dígitos: celular 3xx o fijo 601 a 608', () => {
    expect(v.validatePhone(v.cleanPhone('300 123 4567'))).toBeNull();
    expect(v.validatePhone(v.cleanPhone('+57 601 234 5678'))).toBeNull();
    expect(v.validatePhone('6092345678')).not.toBeNull();
    expect(v.validatePhone('3001234')).not.toBeNull();
    expect(v.validatePhone('2001234567')).not.toBeNull();
  });

  test('SKU en mayúsculas, con guiones, 3 a 32 caracteres', () => {
    expect(v.cleanSku(' sc s1 001 ')).toBe('SC-S1-001');
    expect(v.validateSku('SC-S1-001')).toBeNull();
    expect(v.validateSku('A')).not.toBeNull();
    expect(v.validateSku('-ABC')).not.toBeNull();
  });
});

describe('registros que no se eliminan', () => {
  const token = signToken({ _id: 'abc', email: 'admin@battiolab.co', role: 'admin' });
  test.each([
    ['/api/clients/123', /inactivo/],
    ['/api/employees/123', /retiro/],
    ['/api/sales/123', /nota crédito/]
  ])('DELETE %s responde 405', async (path, message) => {
    const res = await request(app).delete(path).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(405);
    expect(res.body.message).toMatch(message);
  });
});
