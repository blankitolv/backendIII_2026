import mongoose from 'mongoose';
import express from 'express';
import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { config } from '../../src/config/config.js';
import { ERROR_CODES } from '../../src/constants/errors.js';
import { crearRateLimiter } from '../../src/middlewares/rateLimit.middleware.js';
import { errorMiddleware } from '../../src/middlewares/error.middleware.js';
import { useTestDatabase, releaseTestDatabase } from '../helpers/db.js';
import { createUserAndToken } from '../helpers/auth.js';
import { buildDocument, buildUser } from '../helpers/factories.js';
import { UserModel } from '../../src/dao/models/user.model.js';
import { OrderModel } from '../../src/dao/models/order.model.js';
import { DocumentModel } from '../../src/dao/models/document.model.js';

describe('integration - performance y produccion', () => {
  before(useTestDatabase);
  after(releaseTestDatabase);

  it('todos los listados devuelven la envoltura con data y meta', async () => {
    const { token, user } = await createUserAndToken();
    const paths = ['/users', '/orders', '/deliveries', '/documents'];
    for (const path of paths) {
      const res = await request(app).get(`/api/v1${path}`).set('Authorization', `Bearer ${token}`);
      expect(res.status, path).to.equal(200);
      expect(res.body.status, path).to.equal('success');
      expect(res.body.data, path).to.be.an('array');
      expect(res.body.meta, path).to.include.keys('page', 'limit', 'total', 'totalPages');
    }
  });

  it('un listado de 10000 documentos no devuelve el conjunto completo', async () => {
    const { token, user } = await createUserAndToken();
    const parentId = new mongoose.Types.ObjectId();
    const docs = Array.from({ length: 10000 }, () => buildDocument(user.id, parentId));
    await DocumentModel.insertMany(docs);
    const res = await request(app)
      .get('/api/v1/documents?page=1&limit=100')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.data).to.have.length(100);
    expect(res.body.meta.total).to.equal(10000);
    expect(res.body.meta.totalPages).to.equal(100);
  });

  it('sort de un campo de la lista blanca se aplica y uno inventado se ignora', async () => {
    const { token, user } = await createUserAndToken();
    await UserModel.insertMany([
      buildUser({ email: 'aaa-sort@example.com' }),
      buildUser({ email: 'bbb-sort@example.com' })
    ]);
    const sorted = await request(app)
      .get('/api/v1/users?sort=email&page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect(sorted.status).to.equal(200);
    const emails = sorted.body.data.map((item) => item.email);
    expect(emails).to.deep.equal([...emails].sort());
    const bogus = await request(app)
      .get('/api/v1/users?sort=password')
      .set('Authorization', `Bearer ${token}`);
    expect(bogus.status).to.equal(200);
  });

  it('ninguna respuesta de listado expone el password hasheado', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(JSON.stringify(res.body)).to.not.include('password');
    for (const item of res.body.data) {
      expect(item).to.not.have.property('password');
    }
  });

  it('los indices declarados existen en las colecciones', async () => {
    await OrderModel.init();
    await DocumentModel.init();
    await UserModel.init();
    const orderIndexes = await OrderModel.collection.indexes();
    expect(orderIndexes.some((idx) => idx.key.status === 1)).to.equal(true);
    expect(orderIndexes.some((idx) => idx.key.user === 1)).to.equal(true);
    expect(orderIndexes.some((idx) => idx.key.trackingNumber === 1)).to.equal(true);
    const documentIndexes = await DocumentModel.collection.indexes();
    expect(
      documentIndexes.some((idx) => idx.key.parentModel === 1 && idx.key.parentId === 1)
    ).to.equal(true);
    expect(documentIndexes.some((idx) => idx.key.type === 1)).to.equal(true);
  });

  it('el rate limiter responde 429 RATE_LIMIT_EXCEEDED con envoltura estandar', async () => {
    const mini = express();
    mini.use(crearRateLimiter({ windowMs: 60000, max: 3 }));
    mini.get('/x', (req, res) => res.json({ ok: true }));
    mini.use(errorMiddleware);
    for (let i = 0; i < 3; i += 1) {
      const res = await request(mini).get('/x');
      expect(res.status).to.equal(200);
    }
    const res = await request(mini).get('/x');
    expect(res.status).to.equal(429);
    expect(res.body.status).to.equal('error');
    expect(res.body.error).to.equal(ERROR_CODES.RATE_LIMIT_EXCEEDED);
  });

  it('un body mayor a 1 MB responde 413 PAYLOAD_TOO_LARGE', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ payload: 'x'.repeat(1_100_000) });
    expect(res.status).to.equal(413);
    expect(res.body.status).to.equal('error');
    expect(res.body.error).to.equal(ERROR_CODES.PAYLOAD_TOO_LARGE);
  });

  it('los secretos no salen en ninguna respuesta', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).to.equal(400);
    expect(JSON.stringify(res.body)).to.not.include(config.jwtSecret);
  });
});