import mongoose from 'mongoose';
import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { ERROR_CODES } from '../../src/constants/errors.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.js';
import { useTestDatabase, releaseTestDatabase } from '../helpers/db.js';
import { createUserAndToken } from '../helpers/auth.js';
import { buildOrder } from '../helpers/factories.js';
import { OrderModel } from '../../src/dao/models/order.model.js';

describe('integration - orders', () => {
  before(useTestDatabase);
  after(releaseTestDatabase);

  it('flujo principal: crear, obtener y persistencia verificada', async () => {
    const { token, user } = await createUserAndToken();
    const created = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(buildOrder(user.id));
    expect(created.status).to.equal(201);
    expect(created.body.data.status).to.equal(ORDER_STATUS.CREATED);
    const fetched = await request(app)
      .get(`/api/v1/orders/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(fetched.status).to.equal(200);
    expect(fetched.body.data.trackingNumber).to.equal(created.body.data.trackingNumber);
    const persisted = await OrderModel.findById(created.body.data.id);
    expect(persisted.trackingNumber).to.equal(created.body.data.trackingNumber);
    const listed = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(listed.status).to.equal(200);
    expect(listed.body.meta.total).to.equal(1);
  });

  it('campos faltantes devuelven 400 INCOMPLETE_VALUES nombrándolos', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ user: 'u1' });
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal(ERROR_CODES.INCOMPLETE_VALUES);
    expect(res.body.message).to.include('trackingNumber');
  });

  it('peso invalido devuelve 400 INVALID_VALUES', async () => {
    const { token, user } = await createUserAndToken();
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(buildOrder(user.id, { weightKg: 'pesado' }));
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal(ERROR_CODES.INVALID_VALUES);
  });

  it('tracking repetido devuelve 409 DUPLICATE_RESOURCE', async () => {
    const { token, user } = await createUserAndToken();
    const payload = buildOrder(user.id, { trackingNumber: 'TEST-DUPLICADO-1' });
    await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${token}`).send(payload);
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).to.equal(409);
    expect(res.body.error).to.equal(ERROR_CODES.DUPLICATE_RESOURCE);
  });

  it('id inexistente devuelve 404 RESOURCE_NOT_FOUND', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .get(`/api/v1/orders/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal(ERROR_CODES.RESOURCE_NOT_FOUND);
  });
});
