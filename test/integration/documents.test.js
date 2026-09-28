import mongoose from 'mongoose';
import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { ERROR_CODES } from '../../src/constants/errors.js';
import { useTestDatabase, releaseTestDatabase } from '../helpers/db.js';
import { createUserAndToken } from '../helpers/auth.js';
import { buildDocument } from '../helpers/factories.js';
import { DocumentModel } from '../../src/dao/models/document.model.js';

describe('integration - documents', () => {
  before(useTestDatabase);
  after(releaseTestDatabase);

  it('lista y obtiene documentos sin exponer la ruta de disco', async () => {
    const { token, user } = await createUserAndToken();
    const parentId = new mongoose.Types.ObjectId();
    const created = await DocumentModel.create(buildDocument(user.id, parentId));
    const listed = await request(app)
      .get('/api/v1/documents')
      .set('Authorization', `Bearer ${token}`);
    expect(listed.status).to.equal(200);
    expect(listed.body.meta.total).to.equal(1);
    expect(listed.body.data[0]).to.not.have.property('path');
    const fetched = await request(app)
      .get(`/api/v1/documents/${created._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(fetched.status).to.equal(200);
    expect(fetched.body.data.type).to.equal(created.type);
  });

  it('id inexistente devuelve 404 RESOURCE_NOT_FOUND', async () => {
    const { token } = await createUserAndToken();
    const res = await request(app)
      .get(`/api/v1/documents/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal(ERROR_CODES.RESOURCE_NOT_FOUND);
  });
});
