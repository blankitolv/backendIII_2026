import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { mocksService } from '../../src/services/mocks.service.js';
import { ERROR_CODES } from '../../src/constants/errors.js';

function assertErrorShape(body) {
  expect(body).to.have.all.keys('status', 'error', 'message');
  expect(body.status).to.equal('error');
}

describe('Plan 02 - manejo global de errores', () => {
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

  it('cantidad de mocks invalida -> 400 INVALID_MOCKS_AMOUNT', () => {
    try {
      mocksService.generateUsers([]);
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
});
