import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import request from 'supertest';
import { expect } from 'chai';
import { app } from '../../src/app.js';
import { config } from '../../src/config/config.js';
import { ERROR_CODES } from '../../src/constants/errors.js';
import { ROLES } from '../../src/constants/roles.js';
import { DOCUMENT_TYPES } from '../../src/constants/documentTypes.js';
import { useTestDatabase, releaseTestDatabase } from '../helpers/db.js';
import { createUserAndToken } from '../helpers/auth.js';
import { buildOrder, buildDelivery } from '../helpers/factories.js';
import { UserModel } from '../../src/dao/models/user.model.js';
import { OrderModel } from '../../src/dao/models/order.model.js';
import { DeliveryModel } from '../../src/dao/models/delivery.model.js';
import { DocumentModel } from '../../src/dao/models/document.model.js';

// El contenido es un PDF minimo valido en su firma pero con relleno hasta el tamano pedido.
// Los bytes no se validan: el filtro de Multer mira el MIME declarado, que es lo que viaja en
// la cabecera de la parte multipart.
function archivoBuffer(bytes) {
  const cabecera = Buffer.from('%PDF-1.4\n');
  return Buffer.concat([cabecera, Buffer.alloc(Math.max(0, bytes - cabecera.length), 0x61)]);
}

// Los nombres se generan con la carpeta de destino ya resuelta por Multer, asi que el archivo
// vive en el subdirectorio que corresponde a cada uploader.
function rutaEsperada(dir, storedName) {
  return path.join(dir, storedName);
}

function listarArchivos(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
}

describe('integration - uploads', () => {
  before(useTestDatabase);
  after(releaseTestDatabase);

  it('PDF de 2 MB a un usuario devuelve 201, guarda metadatos y no expone la ruta', async () => {
    const { token, user } = await createUserAndToken();
    const res = await request(app)
      .post(`/api/v1/users/${user.id}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .attach('document', archivoBuffer(2 * 1024 * 1024), 'identidad.pdf');

    expect(res.status).to.equal(201);
    expect(res.body.status).to.equal('success');
    expect(res.body.data.type).to.equal(DOCUMENT_TYPES.USER_DOCUMENT);
    expect(res.body.data.originalName).to.equal('identidad.pdf');
    expect(res.body.data.mimeType).to.equal('application/pdf');
    expect(res.body.data).to.not.have.property('path');
    expect(res.body.data.downloadUrl).to.equal(`/api/v1/documents/${res.body.data.id}/download`);

    const stored = await DocumentModel.findById(res.body.data.id);
    expect(stored).to.not.equal(null);
    expect(stored.size).to.equal(2 * 1024 * 1024);
    expect(stored.parentModel).to.equal('User');
    expect(String(stored.parentId)).to.equal(user.id);
    expect(String(stored.uploadedBy)).to.equal(user.id);
    // El nombre en disco es generado, nunca el original: por ahi vienen los separadores.
    expect(stored.storedName).to.not.include('identidad.pdf');
    expect(fs.existsSync(rutaEsperada(config.upload.documentsDir, stored.storedName))).to.equal(true);

    const usuario = await UserModel.findById(user.id);
    expect(usuario.documents.map(String)).to.include(String(stored._id));
  });

  it('sin archivo devuelve 400 FILE_REQUIRED', async () => {
    const { token, user } = await createUserAndToken();
    const res = await request(app)
      .post(`/api/v1/users/${user.id}/documents`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal(ERROR_CODES.FILE_REQUIRED);
  });

  it('tipo no permitido devuelve 415 INVALID_FILE_TYPE y no deja el archivo en disco', async () => {
    const { token, user } = await createUserAndToken();
    const antes = listarArchivos(config.upload.documentsDir).length;
    const res = await request(app)
      .post(`/api/v1/users/${user.id}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .attach('document', Buffer.from('MZ\x90\x00binario'), 'virus.exe');

    expect(res.status).to.equal(415);
    expect(res.body.error).to.equal(ERROR_CODES.INVALID_FILE_TYPE);
    expect(listarArchivos(config.upload.documentsDir).length).to.equal(antes);
    expect(await DocumentModel.countDocuments()).to.equal(0);
  });

  it('archivo de 10 MB devuelve 413 FILE_TOO_LARGE y no deja el archivo en disco', async () => {
    const { token, user } = await createUserAndToken();
    const antes = listarArchivos(config.upload.documentsDir).length;
    const res = await request(app)
      .post(`/api/v1/users/${user.id}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .attach('document', archivoBuffer(10 * 1024 * 1024), 'pesado.pdf');

    expect(res.status).to.equal(413);
    expect(res.body.error).to.equal(ERROR_CODES.FILE_TOO_LARGE);
    // Multer corta el stream al superar el limite: si no se limpia, queda un binario truncado.
    expect(listarArchivos(config.upload.documentsDir).length).to.equal(antes);
    expect(await DocumentModel.countDocuments()).to.equal(0);
  });

  it('envio inexistente devuelve 404 y padre inexistente tambien', async () => {
    const { token } = await createUserAndToken();
    const inexistente = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/v1/orders/${inexistente}/proofs`)
      .set('Authorization', `Bearer ${token}`)
      .attach('proof', archivoBuffer(1024), 'comprobante.pdf');

    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal(ERROR_CODES.RESOURCE_NOT_FOUND);
    expect(listarArchivos(config.upload.proofsDir).length).to.equal(0);
  });

  it('usuario sin permisos sobre el padre devuelve 403', async () => {
    const { token: tokenAjeno } = await createUserAndToken();
    const { user: dueno } = await createUserAndToken();
    const res = await request(app)
      .post(`/api/v1/users/${dueno.id}/documents`)
      .set('Authorization', `Bearer ${tokenAjeno}`)
      .attach('document', archivoBuffer(1024), 'intento.pdf');

    expect(res.status).to.equal(403);
    expect(res.body.error).to.equal(ERROR_CODES.FORBIDDEN);
    expect(listarArchivos(config.upload.documentsDir).length).to.equal(0);
    expect(await DocumentModel.countDocuments()).to.equal(0);
  });

  it('cada endpoint persiste el type correcto y la licencia exige un repartidor', async () => {
    const { token: tokenCliente, user: cliente } = await createUserAndToken();
    const pedido = await OrderModel.create(buildOrder(cliente.id));
    const enCliente = await request(app)
      .post(`/api/v1/orders/${pedido._id}/proofs`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .attach('proof', archivoBuffer(2048), 'pedido.pdf');
    expect(enCliente.status).to.equal(201);
    expect(enCliente.body.data.type).to.equal(DOCUMENT_TYPES.DELIVERY_PROOF);

    const { token: tokenAdmin } = await createUserAndToken({ role: ROLES.ADMIN });
    const repartidor = await createUserAndToken({ role: ROLES.COURIER });
    const entrega = await DeliveryModel.create(buildDelivery(pedido._id, repartidor.user.id));

    // La entrega pertenece al repartidor, no al cliente que creo el pedido: es el caso que
    // distingue `courier` de `user` como campo de propietario.
    const enEntrega = await request(app)
      .post(`/api/v1/deliveries/${entrega._id}/proofs`)
      .set('Authorization', `Bearer ${repartidor.token}`)
      .attach('proof', archivoBuffer(2048), 'entrega.pdf');
    expect(enEntrega.status).to.equal(201);
    expect(enEntrega.body.data.type).to.equal(DOCUMENT_TYPES.DELIVERY_PROOF);
    expect(enEntrega.body.data.parentModel).to.equal('Delivery');

    const licencia = await request(app)
      .post(`/api/v1/users/${repartidor.user.id}/license`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('license', archivoBuffer(2048), 'licencia.pdf');
    expect(licencia.status).to.equal(201);
    expect(licencia.body.data.type).to.equal(DOCUMENT_TYPES.COURIER_LICENSE);

    const aCliente = await request(app)
      .post(`/api/v1/users/${cliente.id}/license`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('license', archivoBuffer(2048), 'licencia.pdf');
    expect(aCliente.status).to.equal(403);

    const listado = await request(app)
      .get('/api/v1/documents?type=courier_license')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(listado.status).to.equal(200);
    expect(listado.body.meta.total).to.equal(1);
    expect(listado.body.data[0].type).to.equal(DOCUMENT_TYPES.COURIER_LICENSE);
  });

  it('descarga devuelve el binario con el Content-Type correcto', async () => {
    const { token, user } = await createUserAndToken();
    const contenido = archivoBuffer(4096);
    const subido = await request(app)
      .post(`/api/v1/users/${user.id}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .attach('document', contenido, 'contrato.pdf');

    const res = await request(app)
      .get(subido.body.data.downloadUrl)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.headers['content-type']).to.equal('application/pdf');
    expect(res.headers['content-disposition']).to.include('contrato.pdf');
    expect(Buffer.from(res.body).equals(contenido)).to.equal(true);
  });

  it('descarga sin permiso devuelve 403 y a metadato sin binario devuelve 404', async () => {
    const { token, user } = await createUserAndToken();
    const subido = await request(app)
      .post(`/api/v1/users/${user.id}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .attach('document', archivoBuffer(1024), 'privado.pdf');

    const { token: tokenAjeno } = await createUserAndToken();
    const ajeno = await request(app)
      .get(subido.body.data.downloadUrl)
      .set('Authorization', `Bearer ${tokenAjeno}`);
    expect(ajeno.status).to.equal(403);
    expect(ajeno.body.error).to.equal(ERROR_CODES.FORBIDDEN);

    const almacenado = await DocumentModel.findById(subido.body.data.id);
    fs.unlinkSync(rutaEsperada(config.upload.documentsDir, almacenado.storedName));
    const sinBinario = await request(app)
      .get(subido.body.data.downloadUrl)
      .set('Authorization', `Bearer ${token}`);
    expect(sinBinario.status).to.equal(404);
  });

  it('DELETE borra metadato, archivo fisico y la referencia en el padre', async () => {
    const { token, user } = await createUserAndToken();
    const { token: tokenAdmin } = await createUserAndToken({ role: ROLES.ADMIN });
    const subido = await request(app)
      .post(`/api/v1/users/${user.id}/documents`)
      .set('Authorization', `Bearer ${token}`)
      .attach('document', archivoBuffer(1024), 'borrable.pdf');
    const almacenado = await DocumentModel.findById(subido.body.data.id);
    const ruta = rutaEsperada(config.upload.documentsDir, almacenado.storedName);
    expect(fs.existsSync(ruta)).to.equal(true);

    const sinPermiso = await request(app)
      .delete(`/api/v1/documents/${subido.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(sinPermiso.status).to.equal(403);

    const res = await request(app)
      .delete(`/api/v1/documents/${subido.body.data.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).to.equal(200);
    expect(res.body.data).to.deep.equal({ id: subido.body.data.id, deleted: true });
    expect(await DocumentModel.findById(subido.body.data.id)).to.equal(null);
    expect(fs.existsSync(ruta)).to.equal(false);
    const usuario = await UserModel.findById(user.id);
    expect(usuario.documents.map(String)).to.not.include(String(subido.body.data.id));
  });

  it('uploads/ queda sin basura y la suite no puede escribir en el repo', () => {
    for (const dir of [config.upload.documentsDir, config.upload.proofsDir]) {
      expect(listarArchivos(dir)).to.deep.equal([]);
    }
    // Garantia de fondo: la raiz de uploads apunta al temporal del sistema, asi que ningun test
    // puede dejar un binario en el `uploads/` del repositorio aunque falle la limpieza.
    // Misma comprobacion que `resolveInsideUploadRoot`: en otro disco `path.relative` devuelve
    // una ruta absoluta en vez de empezar con `..`.
    const relativo = path.relative(process.cwd(), config.upload.root);
    expect(relativo.startsWith('..') || path.isAbsolute(relativo)).to.equal(true);
  });
});
