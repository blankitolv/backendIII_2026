import mongoose from 'mongoose';
import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { mocksService } from '../../src/services/mocks.service.js';
import { ERROR_CODES, ERROR_STATUS } from '../../src/constants/errors.js';
import { ROLES } from '../../src/constants/roles.js';
import { useTestDatabase, releaseTestDatabase } from '../helpers/db.js';
import { createUserAndToken } from '../helpers/auth.js';
import { buildUser } from '../helpers/factories.js';

function assertErrorShape(body) {
  expect(body).to.have.all.keys('status', 'error', 'message');
  expect(body.status).to.equal('error');
}

describe('Plan 02 - manejo global de errores', () => {
  before(useTestDatabase);
  after(releaseTestDatabase);
  it('ruta inexistente -> 404 RESOURCE_NOT_FOUND', async () => {
    const res = await request(app).get('/api/v1/no-existe-xyz');
    expect(res.status).to.equal(404);
    assertErrorShape(res.body);
    expect(res.body.error).to.equal(ERROR_CODES.RESOURCE_NOT_FOUND);
  });

  it('body JSON malformado -> 400 INVALID_VALUES', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": malo}');
    expect(res.status).to.equal(400);
    assertErrorShape(res.body);
    expect(res.body.error).to.equal(ERROR_CODES.INVALID_VALUES);
  });

  it('faltan campos obligatorios -> 400 INCOMPLETE_VALUES nombrando campos', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({});
    expect(res.status).to.equal(400);
    assertErrorShape(res.body);
    expect(res.body.error).to.equal(ERROR_CODES.INCOMPLETE_VALUES);
    expect(res.body.message).to.include('body.email');
  });

  it('sin token -> 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/orders');
    expect(res.status).to.equal(401);
    assertErrorShape(res.body);
    expect(res.body.error).to.equal(ERROR_CODES.UNAUTHORIZED);
  });

  it('cantidad de mocks invalida -> 400 INVALID_MOCKS_AMOUNT', async () => {
    try {
      await mocksService.seedData({ users: [], couriers: [], orders: [], deliveries: [], documents: [] });
      expect.fail('debio lanzar INVALID_MOCKS_AMOUNT');
    } catch (err) {
      expect(err.code).to.equal(ERROR_CODES.INVALID_MOCKS_AMOUNT);
      expect(err.statusCode).to.equal(400);
    }
  });

  it('excepcion no controlada -> 500 sin stack en respuesta', async () => {
    const { errorMiddleware } = await import('../../src/middlewares/error.middleware.js');
    const req = { method: 'GET', originalUrl: '/x', logger: { warn: () => {}, error: () => {} } };
    let statusCode = 0;
    let payload = null;
    const res = {
      status(code) { statusCode = code; return this; },
      json(body) { payload = body; return this; }
    };
    errorMiddleware(new Error('boom interno'), req, res, () => {});
    expect(statusCode).to.equal(500);
    assertErrorShape(payload);
    expect(payload.error).to.equal(ERROR_CODES.INTERNAL_SERVER_ERROR);
    expect(payload).to.not.have.property('stack');
  });

  it('transversal: todo error respeta { status, error, message } y su status', async () => {
    const customer = await createUserAndToken();
    const admin = await createUserAndToken({ role: ROLES.ADMIN });
    const raw = buildUser();
    await request(app).post('/api/v1/auth/register').send(raw);
    const id = new mongoose.Types.ObjectId();
    const cases = [
      request(app).get('/api/v1/auth/me'),
      request(app).get(`/api/v1/users/${id}`).set('Authorization', `Bearer ${customer.token}`),
      request(app).get(`/api/v1/orders/${id}`).set('Authorization', `Bearer ${customer.token}`),
      request(app).get(`/api/v1/deliveries/${id}`).set('Authorization', `Bearer ${customer.token}`),
      request(app).get(`/api/v1/documents/${id}`).set('Authorization', `Bearer ${customer.token}`),
      request(app).get('/api/v1/logger/recent').set('Authorization', `Bearer ${customer.token}`),
      request(app).get('/api/v1/logger/recent'),
      request(app).post('/api/v1/auth/register').send(raw),
      request(app).post('/api/v1/mocks/generateData').send({ users: -1 }),
      request(app).get('/api/v1/logger/recent').set('Authorization', `Bearer ${admin.token}`)
    ];
    for (const run of cases) {
      const res = await run;
      if (res.status < 400) {
        continue;
      }
      assertErrorShape(res.body);
      expect(res.status, `status de ${res.body.error}`).to.equal(ERROR_STATUS[res.body.error]);
    }
  });
});
