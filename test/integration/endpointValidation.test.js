import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import { app } from '../../src/app.js';
import { ERROR_CODES } from '../../src/constants/errors.js';
import { useTestDatabase, releaseTestDatabase } from '../helpers/db.js';
import { createUserAndToken } from '../helpers/auth.js';
import { buildUser, buildOrder, buildDelivery } from '../helpers/factories.js';
import { ordersDao } from '../../src/dao/repositories/orders.dao.js';
import { deliveriesDao } from '../../src/dao/repositories/deliveries.dao.js';
import { usersDao } from '../../src/dao/repositories/users.dao.js';
import { documentsDao } from '../../src/dao/repositories/documents.dao.js';

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

// Rutas POST cuyo cuerpo no es JSON: lo parsea Multer como multipart/form-data y lo valida el
// uploader, no un esquema de `src/validators/`. No son "sin validacion": sin archivo devuelven
// 400, y el segundo test lo comprueba una por una.
const EXEMPT_MULTIPART_POST = [
  { path: '/api/v1/users/{id}/documents', campo: 'document' },
  { path: '/api/v1/users/{id}/license', campo: 'license' },
  { path: '/api/v1/orders/{id}/proofs', campo: 'proof' },
  { path: '/api/v1/deliveries/{id}/proofs', campo: 'proof' }
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
    const routes = collectWriteRoutes().filter((route) => route.method === 'post');
    const multipart = EXEMPT_MULTIPART_POST.map((route) => route.path);
    const tested = routes.filter(
      (route) => !EXEMPT_POST.includes(route.path) && !multipart.includes(route.path)
    );
    expect(tested.map((route) => route.path).sort()).to.deep.equal(
      [
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/api/v1/deliveries',
        '/api/v1/orders',
        '/api/v1/users'
      ].sort()
    );
    // Las exentas por multipart tienen que estar mounted de verdad: si una se perdiera al
    // escribir el router, la lista de arriba no la detectaria.
    const mounted = routes.map((route) => route.path);
    for (const route of multipart) {
      expect(mounted).to.include(route);
    }
    const { token } = await createUserAndToken();
    const findByEmail = sinon.stub(usersDao, 'findByEmail').resolves(null);
    const createOrder = sinon.stub(ordersDao, 'create').resolves({});
    const createDelivery = sinon.stub(deliveriesDao, 'create').resolves({});
    try {
      const register = await request(app).post('/api/v1/auth/register').send({});
      expect(register.status).to.equal(400);
      expect(register.body.error).to.equal(ERROR_CODES.INCOMPLETE_VALUES);
      const user = await request(app).post('/api/v1/users').send({});
      expect(user.status).to.equal(400);
      expect(user.body.error).to.equal(ERROR_CODES.INCOMPLETE_VALUES);
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

  it('las rutas PUT y PATCH con body declaran validacion: body malformado da 400', async () => {
    const { token } = await createUserAndToken();
    const badStatus = await request(app)
      .patch('/api/v1/orders/507f1f77bcf86cd799439011/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'invalid_status' });
    expect(badStatus.status).to.equal(400);
    expect(badStatus.body.error).to.equal(ERROR_CODES.INVALID_VALUES);

    const badDeliveryStatus = await request(app)
      .patch('/api/v1/deliveries/507f1f77bcf86cd799439011/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'invalid_status' });
    expect(badDeliveryStatus.status).to.equal(400);
    expect(badDeliveryStatus.body.error).to.equal(ERROR_CODES.INVALID_VALUES);
  });

  it('las rutas multipart rechazan un body sin archivo con 400', async () => {
    const { token, user } = await createUserAndToken();
    const pedido = await ordersDao.create(buildOrder(user.id));
    const entrega = await deliveriesDao.create(buildDelivery(pedido._id, user.id));

    for (const route of EXEMPT_MULTIPART_POST) {
      const id = route.path.startsWith('/api/v1/users/')
        ? user.id
        : route.path.startsWith('/api/v1/orders/')
          ? pedido._id
          : entrega._id;
      const res = await request(app)
        .post(route.path.replace('{id}', String(id)))
        .set('Authorization', `Bearer ${token}`);
      expect(res.status, route.path).to.equal(400);
      expect(res.body.error, route.path).to.equal(ERROR_CODES.FILE_REQUIRED);
    }
    // Ninguna exencion puede convertir un body vacio en un documento: es el equivalente al
    // `expect(createOrder.called).to.equal(false)` del test de arriba.
    expect(await documentsDao.paginate({})).to.have.property('total', 0);
  });

  it('un body valido si llega al service', async () => {
    const raw = buildUser();
    const res = await request(app).post('/api/v1/auth/register').send(raw);
    expect(res.status).to.equal(201);
  });
});
