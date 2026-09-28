import mongoose from 'mongoose';
import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { ERROR_CODES } from '../../src/constants/errors.js';
import { useTestDatabase, releaseTestDatabase } from '../helpers/db.js';
import { createUserAndToken } from '../helpers/auth.js';

describe('integration - users', () => {
  before(useTestDatabase);
  after(releaseTestDatabase);

  it('lista paginada con meta y sin exponer claves', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.data.items).to.be.an('array');
    expect(res.body.data.meta).to.deep.include({ page: 1, limit: 10 });
    for (const item of res.body.data.items) {
      expect(item).to.not.have.property('password');
    }
  });

  it('obtiene un usuario por id', async () => {
    const { token, user } = await createUserAndToken();
    const res = await request(app)
      .get(`/api/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.data.id).to.equal(user.id);
  });

  it('id inexistente devuelve 404 RESOURCE_NOT_FOUND', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .get(`/api/v1/users/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal(ERROR_CODES.RESOURCE_NOT_FOUND);
  });

  it('sin token devuelve 401', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).to.equal(401);
    expect(res.body.error).to.equal(ERROR_CODES.UNAUTHORIZED);
  });
});
