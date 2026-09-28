import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { expect } from 'chai';
import { load as loadYaml } from 'js-yaml';
import { app } from '../../src/app.js';
import { checkDocsCoverage } from '../../src/config/swagger.js';
import { toUserDTO } from '../../src/dto/user.dto.js';
import { toOrderDTO } from '../../src/dto/order.dto.js';
import { toDeliveryDTO } from '../../src/dto/delivery.dto.js';
import { toDocumentDTO } from '../../src/dto/document.dto.js';
import {
  incompleteValues,
  unauthorized,
  forbidden,
  notFound
} from '../../src/utils/errorFactory.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const yamlPath = path.resolve(currentDir, '../../docs/openapi.yaml');
const yamlSpec = loadYaml(readFileSync(yamlPath, 'utf8'));

const MINIMUM_PATHS = [
  '/health',
  '/health/ready',
  '/auth/register',
  '/auth/login',
  '/auth/me',
  '/users',
  '/users/{id}',
  '/orders',
  '/orders/{id}',
  '/deliveries',
  '/deliveries/{id}',
  '/documents',
  '/documents/{id}',
  '/mocks/generateData',
  '/mocks/users',
  '/mocks/orders',
  '/mocks/deliveries',
  '/mocks/full',
  '/mocks',
  '/logger/recent',
  '/logger/error-lines',
  '/logger/test'
];

// Mismo orden de montaje que src/routes/index.js. Express 5 no expone el
// prefijo de un router montado, asi que el test lo pide en este orden y
// falla si la cantidad de routers cambia sin actualizar spec y lista.
const API_MOUNT_ORDER = [
  '/auth',
  '/users',
  '/orders',
  '/deliveries',
  '/documents',
  '/health',
  '/logger',
  '/mocks'
];

function collectMountedRoutes() {
  // En Express 5 el stack vive en app.router, no en app._router.
  const apiLayer = (app.router?.stack ?? []).find(
    (layer) =>
      Array.isArray(layer.handle?.stack) &&
      layer.handle.stack.length > 0 &&
      layer.handle.stack.every((child) => Array.isArray(child.handle?.stack))
  );
  expect(apiLayer, 'router /api/v1 encontrado').to.exist;
  expect(apiLayer.handle.stack).to.have.length(API_MOUNT_ORDER.length);
  const routes = [];
  apiLayer.handle.stack.forEach((child, index) => {
    const prefix = `/api/v1${API_MOUNT_ORDER[index]}`;
    for (const layer of child.handle.stack) {
      if (!layer.route) {
        continue;
      }
      const suffix = String(layer.route.path).replace(/:([A-Za-z0-9_]+)/g, '{$1}');
      const fullPath = suffix === '/' ? prefix : `${prefix}${suffix}`;
      for (const method of Object.keys(layer.route.methods ?? {})) {
        if (layer.route.methods[method] === true) {
          routes.push({ method: method.toUpperCase(), path: fullPath });
        }
      }
    }
  });
  return routes;
}

function collectSpecRoutes(spec) {
  const routes = [];
  for (const [specPath, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of Object.keys(pathItem ?? {})) {
      if (method === 'parameters') {
        continue;
      }
      routes.push({ method: method.toUpperCase(), path: `/api/v1${specPath}` });
    }
  }
  return routes;
}

function resolveRef(spec, ref) {
  const parts = ref.replace(/^#\//, '').split('/');
  let node = spec;
  for (const part of parts) {
    node = node?.[part];
  }
  return node;
}

function collectRefs(node, refs = []) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectRefs(item, refs));
  } else if (node && typeof node === 'object') {
    if (typeof node.$ref === 'string') {
      refs.push(node.$ref);
    }
    Object.values(node).forEach((value) => collectRefs(value, refs));
  }
  return refs;
}

describe('Documentacion con Swagger', () => {
  let spec;

  before(async () => {
    const res = await request(app).get('/api/v1/docs.json');
    expect(res.status).to.equal(200);
    spec = res.body;
  });

  it('/api/v1/docs y /api/docs responden 200 HTML', async () => {
    const first = await request(app).get('/api/v1/docs/');
    expect(first.status).to.equal(200);
    expect(first.headers['content-type']).to.include('text/html');
    const second = await request(app).get('/api/docs/');
    expect(second.status).to.equal(200);
    expect(second.headers['content-type']).to.include('text/html');
  });

  it('/api/v1/docs.json y /api/docs.json devuelven el mismo objeto', async () => {
    const first = await request(app).get('/api/v1/docs.json');
    const second = await request(app).get('/api/docs.json');
    expect(first.status).to.equal(200);
    expect(second.status).to.equal(200);
    expect(first.text).to.equal(second.text);
  });

  it('lo servido sale de docs/openapi.yaml sin deriva', async () => {
    expect(spec).to.deep.equal(yamlSpec);
  });

  it('contiene los paths minimos requeridos', async () => {
    for (const minimum of MINIMUM_PATHS) {
      expect(spec.paths, `path ${minimum}`).to.have.property(minimum);
    }
  });

  it('cobertura bidireccional: spec y router coinciden', async () => {
    const mounted = collectMountedRoutes();
    const documented = collectSpecRoutes(spec);
    const key = (route) => `${route.method} ${route.path}`;
    const documentedKeys = new Set(documented.map(key));
    const mountedKeys = new Set(mounted.map(key));
    const missing = mounted.filter((route) => !documentedKeys.has(key(route)));
    const extra = documented.filter((route) => !mountedKeys.has(key(route)));
    expect(missing, `rutas sin documentar: ${JSON.stringify(missing)}`).to.deep.equal([]);
    expect(extra, `rutas documentadas que no existen: ${JSON.stringify(extra)}`).to.deep.equal([]);
    expect(() => checkDocsCoverage(app)).to.not.throw();
  });

  it('schemas requeridos definidos y Error con required y ejemplos reales', async () => {
    for (const name of ['Order', 'User', 'Error', 'RespuestaExitosa']) {
      expect(spec.components.schemas, `schema ${name}`).to.have.property(name);
    }
    expect(spec.components.schemas.Error.required).to.deep.equal(['status', 'error', 'message']);
    expect(spec.components.schemas.Error.example).to.deep.equal({
      status: 'error',
      error: 'RESOURCE_NOT_FOUND',
      message: notFound('pedido').message
    });
    const responseExample = (name) =>
      spec.components.responses[name].content['application/json'].example;
    expect(responseExample('Error400').message).to.equal(
      incompleteValues(['email', 'password']).message
    );
    expect(responseExample('Error401').message).to.equal(unauthorized().message);
    expect(responseExample('Error403').message).to.equal(forbidden().message);
    expect(responseExample('Error404').message).to.equal(notFound('pedido').message);
  });

  it('cada operacion declara operationId unico y requestBody valido', async () => {
    const seen = new Set();
    const expectedInputs = {
      'post /auth/register': '#/components/schemas/RegisterInput',
      'post /auth/login': '#/components/schemas/LoginInput',
      'post /orders': '#/components/schemas/OrderInput',
      'post /deliveries': '#/components/schemas/DeliveryInput',
      'post /mocks/generateData': '#/components/schemas/MocksGenerateInput'
    };
    for (const [specPath, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (method === 'parameters') {
          continue;
        }
        expect(operation.operationId, `${method} ${specPath}`).to.be.a('string');
        expect(seen.has(operation.operationId), `operationId duplicado ${operation.operationId}`).to.equal(false);
        seen.add(operation.operationId);
        const ref = operation.requestBody?.content?.['application/json']?.schema?.$ref;
        if (ref) {
          expect(resolveRef(spec, ref), `ref ${ref}`).to.exist;
        }
        const expected = expectedInputs[`${method} ${specPath}`];
        if (expected) {
          expect(ref, `input de ${method} ${specPath}`).to.equal(expected);
        }
      }
    }
  });

  it('todas las referencias $ref de los paths existen', async () => {
    for (const ref of collectRefs(spec.paths)) {
      expect(resolveRef(spec, ref), `ref ${ref}`).to.exist;
    }
  });

  it('schemas de recurso coinciden con lo que devuelve el DTO real', async () => {
    const stamp = new Date('2026-09-28T10:00:00.000Z');
    const cases = [
      [
        'User',
        toUserDTO({
          _id: '64f1a2b3c4d5e6f70819293a',
          name: 'Ana Gomez',
          email: 'ana@example.com',
          role: 'customer',
          password: 'secreto',
          passwordHash: 'hash',
          createdAt: stamp,
          updatedAt: stamp
        })
      ],
      [
        'Order',
        toOrderDTO({
          _id: '64f1a2b3c4d5e6f70819293b',
          user: '64f1a2b3c4d5e6f70819293a',
          trackingNumber: 'SN-2026-000123',
          status: 'created',
          origin: 'Buenos Aires',
          destination: 'Cordoba',
          weightKg: 2.5,
          deliveryAddress: 'Av. Colon 1234',
          priority: 'normal',
          createdAt: stamp,
          updatedAt: stamp
        })
      ],
      [
        'Delivery',
        toDeliveryDTO({
          _id: '64f1a2b3c4d5e6f70819293c',
          order: '64f1a2b3c4d5e6f70819293b',
          courier: '64f1a2b3c4d5e6f70819293d',
          status: 'assigned',
          deliveredAt: null,
          createdAt: stamp,
          updatedAt: stamp
        })
      ],
      [
        'Document',
        toDocumentDTO({
          _id: '64f1a2b3c4d5e6f70819293e',
          originalName: 'comprobante.pdf',
          mimeType: 'application/pdf',
          size: 184320,
          type: 'delivery_proof',
          parentModel: 'Delivery',
          parentId: '64f1a2b3c4d5e6f70819293c',
          path: 'uploads/comprobante.pdf',
          uploadedAt: stamp
        })
      ]
    ];
    for (const [name, dto] of cases) {
      const properties = Object.keys(spec.components.schemas[name].properties ?? {}).sort();
      expect(Object.keys(dto).sort(), `propiedades de ${name}`).to.deep.equal(properties);
      expect(dto, `${name} sin password`).to.not.have.property('password');
      expect(dto, `${name} sin ruta de disco`).to.not.have.property('path');
    }
  });

  it('ningun schema de respuesta declara password', async () => {
    for (const [name, schema] of Object.entries(spec.components.schemas)) {
      if (name === 'RegisterInput' || name === 'LoginInput') {
        continue;
      }
      expect(JSON.stringify(schema), `schema ${name}`).to.not.include('"password"');
    }
  });
});
