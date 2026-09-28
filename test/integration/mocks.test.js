import mongoose from 'mongoose';
import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app.js';
import { mocksService } from '../../src/services/mocks.service.js';
import { usersDao } from '../../src/dao/repositories/users.dao.js';
import { ordersDao } from '../../src/dao/repositories/orders.dao.js';
import { UserModel } from '../../src/dao/models/user.model.js';
import { OrderModel } from '../../src/dao/models/order.model.js';
import { DeliveryModel } from '../../src/dao/models/delivery.model.js';
import { DocumentModel } from '../../src/dao/models/document.model.js';
import { MOCKS_DEFAULT_PASSWORD } from '../../src/constants/mockRanges.js';
import { ERROR_CODES } from '../../src/constants/errors.js';
import { comparePassword } from '../../src/utils/hashPassword.js';

let mongo;

async function cleanAll() {
  await Promise.all([
    UserModel.deleteMany({}),
    OrderModel.deleteMany({}),
    DeliveryModel.deleteMany({}),
    DocumentModel.deleteMany({})
  ]);
}

describe('Plan 03 - modulo de mocks', () => {
  before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await cleanAll();
  });

  it('generateData con solo users responde 200 y no rompe', async () => {
    const res = await request(app).post('/api/v1/mocks/generateData').send({ users: 10 });
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('success');
    expect(res.body.data.users).to.equal(10);
    const total = await UserModel.countDocuments();
    expect(total).to.equal(10);
  });

  it('generateData completo deja populate y referencias existentes', async () => {
    await request(app)
      .post('/api/v1/mocks/generateData')
      .send({ users: 5, couriers: 2, orders: 6, deliveries: 4, documents: 3, seed: 42 });
    const orders = await OrderModel.find().populate('user');
    expect(orders).to.have.length(6);
    for (const order of orders) {
      expect(order.user?._id).to.exist;
    }
    const deliveries = await DeliveryModel.find();
    expect(deliveries).to.have.length(4);
    for (const delivery of deliveries) {
      const order = await OrderModel.findById(delivery.order);
      const courier = await UserModel.findById(delivery.courier);
      expect(order).to.exist;
      expect(courier).to.exist;
    }
    const documents = await DocumentModel.find();
    expect(documents).to.have.length(3);
  });

  it('cantidad negativa o decimal -> 400 INVALID_VALUES nombrando campos', async () => {
    const res = await request(app).post('/api/v1/mocks/generateData').send({ users: -3 });
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal(ERROR_CODES.INVALID_VALUES);
    expect(res.body.message).to.include('users');
  });

  it('todo en cero -> 400 INVALID_MOCKS_AMOUNT', async () => {
    const res = await request(app).post('/api/v1/mocks/generateData').send({});
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal(ERROR_CODES.INVALID_MOCKS_AMOUNT);
  });

  it('cantidad fuera de rango -> 400 INVALID_MOCKS_AMOUNT', async () => {
    const res = await request(app).post('/api/v1/mocks/full?cantidad=500');
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal(ERROR_CODES.INVALID_MOCKS_AMOUNT);
  });

  it('password hasheada: compare true y login funciona', async () => {
    const created = await request(app).post('/api/v1/mocks/generateData').send({ users: 2, seed: 9 });
    expect(created.status).to.equal(200);
    const user = await UserModel.findOne();
    expect(user.password).to.not.equal(MOCKS_DEFAULT_PASSWORD);
    expect(await comparePassword(MOCKS_DEFAULT_PASSWORD, user.password)).to.equal(true);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: MOCKS_DEFAULT_PASSWORD });
    expect(login.status).to.equal(200);
    expect(login.body.data.token).to.be.a('string');
  });

  it('misma seed produce exactamente los mismos datos', async () => {
    await request(app).post('/api/v1/mocks/generateData').send({ users: 4, orders: 4, seed: 123 });
    const first = (await OrderModel.find().sort({ trackingNumber: 1 })).map((o) => o.trackingNumber);
    const firstEmails = (await UserModel.find().sort({ email: 1 })).map((u) => u.email);
    await cleanAll();
    await request(app).post('/api/v1/mocks/generateData').send({ users: 4, orders: 4, seed: 123 });
    const second = (await OrderModel.find().sort({ trackingNumber: 1 })).map((o) => o.trackingNumber);
    const secondEmails = (await UserModel.find().sort({ email: 1 })).map((u) => u.email);
    expect(second).to.deep.equal(first);
    expect(secondEmails).to.deep.equal(firstEmails);
  });

  it('100 usuarios + 100 pedidos usan un insertMany por entidad', async () => {
    const usersSpy = sinon.spy(usersDao, 'insertMany');
    const ordersSpy = sinon.spy(ordersDao, 'insertMany');
    try {
      const started = Date.now();
      const res = await request(app)
        .post('/api/v1/mocks/generateData')
        .send({ users: 100, orders: 100, seed: 5 });
      const durationMs = Date.now() - started;
      expect(res.status).to.equal(200);
      expect(usersSpy.calledOnce).to.equal(true);
      expect(ordersSpy.calledOnce).to.equal(true);
      expect(durationMs).to.be.below(10000);
    } finally {
      usersSpy.restore();
      ordersSpy.restore();
    }
  });

  it('DELETE /api/v1/mocks limpia todo', async () => {
    await request(app).post('/api/v1/mocks/full?cantidad=5');
    const res = await request(app).delete('/api/v1/mocks');
    expect(res.status).to.equal(200);
    expect(await UserModel.countDocuments()).to.equal(0);
    expect(await OrderModel.countDocuments()).to.equal(0);
    expect(await DeliveryModel.countDocuments()).to.equal(0);
    expect(await DocumentModel.countDocuments()).to.equal(0);
  });

  it('generadores no usan _id de relacion: solo ids de insertMany previos', async () => {
    const result = await mocksService.generateData({ users: 3, couriers: 1, orders: 3, seed: 77 });
    expect(result.orders).to.equal(3);
    const userIds = new Set((await UserModel.find()).map((u) => String(u._id)));
    const orders = await OrderModel.find();
    for (const order of orders) {
      expect(userIds.has(String(order.user))).to.equal(true);
    }
  });
});
