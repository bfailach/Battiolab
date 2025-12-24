/* eslint-disable @typescript-eslint/no-var-requires */
const request = require('supertest');
const app = require('../server/index');

describe('Server integration tests', () => {
  test('POST /api/test-body-parser returns parsed JSON', async () => {
    const payload = { hello: 'world', num: 1 };
    const res = await request(app)
      .post('/api/test-body-parser')
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('receivedBody');
    expect(res.body.receivedBody).toMatchObject(payload);
  });
});
