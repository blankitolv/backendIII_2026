import mongoose from 'mongoose';
import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { ERROR_CODES } from '../../src/constants/errors.js';
import { ROLES } from '../../src/constants/roles.js';
import { useTestDatabase, releaseTestDatabase } from '../helpers/db.js';
import { createUserAndToken } from '../helpers/auth.js';
import { buildOrder, buildDelivery } from '../helpers/factories.js';
import { OrderModel } from '../../src/dao/models/order.model.js';

describe('integration - deliveries', () => {
  before(useTestDatabase);
  after(releaseTestDatabase);

  async function seedOrderAndCourier() {
    const { token, user } = await createUserAndToken();
    const courier = await createUserAndToken({ role: ROLES.COURIER });
    const order = await OrderModel.create(buildOrder(user.id));
    return { token, order, courierId: courier.user.id };
  }

  it('crea una entrega vinculada a un envio valido', async () => {
    const { token, order, courierId } = await seedOrderAndCourier();
    const res = await request(app)
      .post('/api/v1/deliveries')
      .set('Authorization', `Bearer ${token}`)
      .send(buildDelivery(order._id, courierId));
    expect(res.status).to.equal(201);
    expect(res.body.data.order).to.equal(String(order._id));
    expect(res.body.data.courier).to.equal(courierId);
  });

  it('lista y obtiene entregas', async () => {
    const { token, order, courierId } = await seedOrderAndCourier();
    const created = await request(app)
      .post('/api/v1/deliveries')
      .set('Authorization', `Bearer ${token}`)
      .send(buildDelivery(order._id, courierId));
    const listed = await request(app)
      .get('/api/v1/deliveries')
      .set('Authorization', `Bearer ${token}`);
    expect(listed.status).to.equal(200);
    expect(listed.body.meta.total).to.equal(1);
    const fetched = await request(app)
      .get(`/api/v1/deliveries/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(fetched.status).to.equal(200);
  });

  it('campos faltantes devuelven 400 INCOMPLETE_VALUES', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .post('/api/v1/deliveries')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal(ERROR_CODES.INCOMPLETE_VALUES);
  });

  it('id inexistente devuelve 404 RESOURCE_NOT_FOUND', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .get(`/api/v1/deliveries/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal(ERROR_CODES.RESOURCE_NOT_FOUND);
  });

  it('PATCH /status actualiza estado y setea deliveredAt cuando pasa a delivered', async () => {
    const { token, order, courierId } = await seedOrderAndCourier();
    const created = await request(app)
      .post('/api/deliveries')
      .set('Authorization', `Bearer ${token}`)
      .send({ order: String(order._id), courier: courierId });
    expect(created.status).to.equal(201);
    const deliveryId = created.body.data.id;

    // PATCH /api/deliveries/:id/status a in_transit
    const patchTransit = await request(app)
      .patch(`/api/deliveries/${deliveryId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_transit' });
    expect(patchTransit.status).to.equal(200);
    expect(patchTransit.body.data.status).to.equal('in_transit');

    // PATCH a delivered: asigna deliveredAt
    const patchDelivered = await request(app)
      .patch(`/api/deliveries/${deliveryId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'delivered' });
    expect(patchDelivered.status).to.equal(200);
    expect(patchDelivered.body.data.status).to.equal('delivered');
    expect(patchDelivered.body.data.deliveredAt).to.exist;
  });
});
