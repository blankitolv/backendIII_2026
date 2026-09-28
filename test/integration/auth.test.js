import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { ERROR_CODES } from '../../src/constants/errors.js';
import { ROLES } from '../../src/constants/roles.js';
import { useTestDatabase, releaseTestDatabase } from '../helpers/db.js';
import { buildUser } from '../helpers/factories.js';

describe('integration - auth', () => {
  before(useTestDatabase);
  after(releaseTestDatabase);

  it('register crea el usuario sin exponer la clave', async () => {
    const raw = buildUser({ role: ROLES.CUSTOMER });
    const res = await request(app).post('/api/v1/auth/register').send(raw);
    expect(res.status).to.equal(201);
    expect(res.body.status).to.equal('success');
    expect(res.body.data.email).to.equal(raw.email);
    expect(res.body.data).to.not.have.property('password');
  });

  it('register duplicado devuelve 409 DUPLICATE_RESOURCE', async () => {
    const raw = buildUser();
    await request(app).post('/api/v1/auth/register').send(raw);
    const res = await request(app).post('/api/v1/auth/register').send(raw);
    expect(res.status).to.equal(409);
    expect(res.body.error).to.equal(ERROR_CODES.DUPLICATE_RESOURCE);
  });

  it('login devuelve token y me devuelve identidad', async () => {
    const raw = buildUser();
    await request(app).post('/api/v1/auth/register').send(raw);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: raw.email, password: raw.password });
    expect(login.status).to.equal(200);
    expect(login.body.data.token).to.be.a('string');
    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.data.token}`);
    expect(me.status).to.equal(200);
    expect(me.body.data.role).to.equal(ROLES.CUSTOMER);
    expect(me.body.data).to.not.have.property('password');
  });

  it('login con clave erronea devuelve 401 UNAUTHORIZED', async () => {
    const raw = buildUser();
    await request(app).post('/api/v1/auth/register').send(raw);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: raw.email, password: 'clave-equivocada' });
    expect(res.status).to.equal(401);
    expect(res.body.error).to.equal(ERROR_CODES.UNAUTHORIZED);
  });

  it('me sin token devuelve 401 con contrato de error', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).to.equal(401);
    expect(Object.keys(res.body).sort()).to.deep.equal(['error', 'message', 'status']);
  });
});
