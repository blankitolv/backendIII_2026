import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';

describe('integration - health', () => {
  it('GET /api/v1/health responde 200 con estado, uptime y version', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('success');
    expect(res.body.data.status).to.equal('up');
    expect(res.body.data.uptime).to.be.a('number');
    expect(res.body.data.version).to.equal('1.0.0');
  });
});
