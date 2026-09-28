import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { useTestDatabase, releaseTestDatabase } from '../helpers/db.js';
import { createUserAndToken } from '../helpers/auth.js';
import { buildUser } from '../helpers/factories.js';
import { UserModel } from '../../src/dao/models/user.model.js';

describe('integration - pagination', () => {
  before(useTestDatabase);
  after(releaseTestDatabase);

  beforeEach(async () => {
    const docs = Array.from({ length: 25 }, () => buildUser());
    await UserModel.insertMany(docs);
  });

  it('page y limit recortan con meta.total correcto', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .get('/api/v1/users?page=2&limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.data).to.have.length(10);
    expect(res.body.meta).to.deep.equal({ page: 2, limit: 10, total: 26, totalPages: 3 });
  });

  it('sin query usa page 1 y limit 10', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.data).to.have.length(10);
    expect(res.body.meta).to.deep.include({ page: 1, limit: 10, total: 26 });
  });

  it('limit gigante se acota al maximo', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .get('/api/v1/users?limit=500')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.meta.limit).to.equal(100);
    expect(res.body.meta.total).to.equal(26);
  });
});
