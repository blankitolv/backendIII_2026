import mongoose from 'mongoose';
import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { ERROR_CODES } from '../../src/constants/errors.js';
import { useTestDatabase, releaseTestDatabase, testUri } from '../helpers/db.js';

describe('integration - health', () => {
  before(useTestDatabase);
  after(releaseTestDatabase);

  it('GET /api/v1/health responde estado, uptime, version, environment y timestamp', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('success');
    expect(res.body.data.status).to.equal('up');
    expect(res.body.data.uptime).to.be.a('number');
    expect(res.body.data.version).to.equal('1.0.0');
    expect(res.body.data.environment).to.equal('test');
    expect(new Date(res.body.data.timestamp).getTime()).to.not.be.NaN;
  });

  it('GET /api/health funciona directamente con el alias /api', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('success');
    expect(res.body.data.status).to.equal('up');
  });

  it('GET /api/v1/health/ready responde 200 cuando la base esta lista', async () => {
    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('success');
    expect(res.body.data.status).to.equal('ready');
  });

  it('GET /api/v1/health/ready responde 503 NOT_READY sin conexion y se recupera', async () => {
    await mongoose.disconnect();
    const res = await request(app).get('/api/v1/health/ready');
    expect(res.status).to.equal(503);
    expect(res.body.error).to.equal(ERROR_CODES.NOT_READY);
    await mongoose.connect(await testUri());
    const recovered = await request(app).get('/api/v1/health/ready');
    expect(recovered.status).to.equal(200);
  });
});