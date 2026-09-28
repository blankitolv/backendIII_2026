import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import { app } from '../../src/app.js';
import { ERROR_CODES } from '../../src/constants/errors.js';
import { useTestDatabase, releaseTestDatabase } from '../helpers/db.js';
import { createUserAndToken } from '../helpers/auth.js';
import { buildUser } from '../helpers/factories.js';
import { ordersDao } from '../../src/dao/repositories/orders.dao.js';
import { deliveriesDao } from '../../src/dao/repositories/deliveries.dao.js';
import { usersDao } from '../../src/dao/repositories/users.dao.js';

const API_MOUNT_ORDER = [
  '/auth',
  '/users',
  '/orders',
  '/deliveries',
  '/documents',
  '/health',
  '/logger',
  '/mocks'
];

// Rutas POST sin esquema de validacion por diseno: mocks valida conteos en
// el service (assertCount) y logger/test no recibe body.
const EXEMPT_POST = [
  '/api/v1/mocks/generateData',
  '/api/v1/mocks/users',
  '/api/v1/mocks/orders',
  '/api/v1/mocks/deliveries',
  '/api/v1/mocks/full',
  '/api/v1/logger/test'
];

function collectWriteRoutes() {
  const apiLayer = (app.router?.stack ?? []).find(
    (layer) =>
      Array.isArray(layer.handle?.stack) &&
      layer.handle.stack.length > 0 &&
      layer.handle.stack.every((child) => Array.isArray(child.handle?.stack))
  );
  const routes = [];
  apiLayer.handle.stack.forEach((child, index) => {
    const prefix = `/api/v1${API_MOUNT_ORDER[index]}`;
    for (const layer of child.handle.stack) {
      if (!layer.route) {
        continue;
      }
      const suffix = String(layer.route.path).replace(/:([A-Za-z0-9_]+)/g, '{$1}');
      const fullPath = suffix === '/' ? prefix : `${prefix}${suffix}`;
      for (const method of Object.keys(layer.route.methods ?? {})) {
        if (['post', 'put', 'patch'].includes(method) && layer.route.methods[method] === true) {
          routes.push({ method, path: fullPath });
        }
      }
    }
  });
  return routes;
}

describe('integration - endpointValidation', () => {
  before(useTestDatabase);
  after(releaseTestDatabase);

  it('toda ruta POST no exenta declara validacion: body malformado da 400', async () => {
    const routes = collectWriteRoutes();
    const tested = routes.filter((route) => !EXEMPT_POST.includes(route.path));
    expect(tested.map((route) => route.path).sort()).to.deep.equal(
      ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/deliveries', '/api/v1/orders'].sort()
    );
    const { token } = await createUserAndToken();
    const findByEmail = sinon.stub(usersDao, 'findByEmail').resolves(null);
    const createOrder = sinon.stub(ordersDao, 'create').resolves({});
    const createDelivery = sinon.stub(deliveriesDao, 'create').resolves({});
    try {
      const register = await request(app).post('/api/v1/auth/register').send({});
      expect(register.status).to.equal(400);
      expect(register.body.error).to.equal(ERROR_CODES.INCOMPLETE_VALUES);
      const login = await request(app).post('/api/v1/auth/login').send({});
      expect(login.status).to.equal(400);
      const order = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ user: 'u1' });
      expect(order.status).to.equal(400);
      const delivery = await request(app)
        .post('/api/v1/deliveries')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(delivery.status).to.equal(400);
      expect(findByEmail.called).to.equal(false);
      expect(createOrder.called).to.equal(false);
      expect(createDelivery.called).to.equal(false);
    } finally {
      findByEmail.restore();
      createOrder.restore();
      createDelivery.restore();
    }
  });

  it('un body valido si llega al service', async () => {
    const raw = buildUser();
    const res = await request(app).post('/api/v1/auth/register').send(raw);
    expect(res.status).to.equal(201);
  });
});
