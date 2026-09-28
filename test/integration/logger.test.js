import jwt from 'jsonwebtoken';
import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { config } from '../../src/config/config.js';
import { logger } from '../../src/utils/logger.js';
import { formatRedact } from '../../src/utils/loggerRedact.js';
import { ROLES } from '../../src/constants/roles.js';
import { ERROR_CODES } from '../../src/constants/errors.js';

function adminToken() {
  return jwt.sign({ sub: 'admin-test-id', role: ROLES.ADMIN }, config.jwtSecret, { expiresIn: '5m' });
}

function customerToken() {
  return jwt.sign({ sub: 'customer-test-id', role: ROLES.CUSTOMER }, config.jwtSecret, { expiresIn: '5m' });
}

async function waitForRecent(token, needle) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await request(app)
      .get('/api/v1/logger/recent?lines=50')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    if (res.body.data.lines.some((line) => line.includes(needle))) {
      return res.body.data.lines;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  expect.fail(`linea de log no aparecio: ${needle}`);
}

describe('Plan 04 - logging con Winston', () => {
  it('enmascara password y token con [REDACTED] y nunca escribe valores', () => {
    const format = formatRedact();
    const out = format.transform(
      { level: 'info', message: 'x', password: 'secreta', token: 'abc', nested: { apiKey: 'k' } },
      {}
    );
    expect(out.password).to.equal('[REDACTED]');
    expect(out.token).to.equal('[REDACTED]');
    expect(out.nested.apiKey).to.equal('[REDACTED]');
    expect(JSON.stringify(out)).to.not.include('secreta');
    expect(JSON.stringify(out)).to.not.include('abc');
  });

  it('nivel error en test y sin consola', () => {
    expect(logger.level).to.equal('error');
    const names = logger.transports.map((t) => t.constructor.name);
    expect(names).to.not.include('Console');
  });

  it('cada request devuelve x-request-id de correlacion', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).to.equal(200);
    expect(res.headers).to.have.property('x-request-id');
  });

  it('sin token -> 401 y con rol no admin -> 403', async () => {
    const anon = await request(app).get('/api/v1/logger/recent');
    expect(anon.status).to.equal(401);
    expect(anon.body.error).to.equal(ERROR_CODES.UNAUTHORIZED);
    const customer = await request(app)
      .get('/api/v1/logger/recent')
      .set('Authorization', `Bearer ${customerToken()}`);
    expect(customer.status).to.equal(403);
    expect(customer.body.error).to.equal(ERROR_CODES.FORBIDDEN);
  });

  it('lines invalido -> 400 INVALID_VALUES', async () => {
    const res = await request(app)
      .get('/api/v1/logger/recent?lines=0')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal(ERROR_CODES.INVALID_VALUES);
  });

  it('POST /logger/test escribe niveles y recent/error-lines los devuelven', async () => {
    const token = adminToken();
    const written = await request(app)
      .post('/api/v1/logger/test')
      .set('Authorization', `Bearer ${token}`);
    expect(written.status).to.equal(201);

    const recent = await waitForRecent(token, 'Entrada de prueba error.');
    expect(recent.join('\n')).to.not.include('secreta');

    const errors = await request(app)
      .get('/api/v1/logger/error-lines?lines=20')
      .set('Authorization', `Bearer ${token}`);
    expect(errors.status).to.equal(200);
    expect(errors.body.data.file).to.equal('error.log');
    expect(errors.body.data.lines.some((line) => line.includes('Entrada de prueba error.'))).to.equal(true);
  });

  it('GET /loggerTest y GET /api/loggerTest responden 200 y registran las trazas', async () => {
    const res1 = await request(app).get('/loggerTest');
    expect(res1.status).to.equal(200);
    expect(res1.body.status).to.equal('success');
    expect(res1.body.data.written).to.equal(true);

    const res2 = await request(app).get('/api/loggerTest');
    expect(res2.status).to.equal(200);
    expect(res2.body.status).to.equal('success');
  });
});
