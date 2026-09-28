import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { load as loadYaml } from 'js-yaml';
import { config } from './config.js';
import { logger } from '../utils/logger.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const specPath = path.resolve(currentDir, '../../docs/openapi.yaml');

// Unica fuente de la documentacion: docs/openapi.yaml. Este modulo solo la
// carga y la sirve, nunca la duplica.
export const swaggerSpec = loadYaml(readFileSync(specPath, 'utf8'));

export const swaggerRouter = Router();
swaggerRouter.use(swaggerUi.serve);
swaggerRouter.get('/', swaggerUi.setup(swaggerSpec, { explorer: true }));

// Orden de montaje de src/routes/index.js. Express 5 no expone el prefijo de
// un router montado, asi que el chequeo de cobertura lo pide en este orden.
// Si se agrega o reordena un router, el chequeo avisa en development y el
// test de cobertura falla hasta actualizar spec y lista.
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

function normalizeRoutePath(routePath) {
  return String(routePath).replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function collectMountedRoutes(app) {
  const apiLayer = (app.router?.stack ?? []).find(
    (layer) =>
      Array.isArray(layer.handle?.stack) &&
      layer.handle.stack.length > 0 &&
      layer.handle.stack.every((child) => Array.isArray(child.handle?.stack))
  );
  if (!apiLayer) {
    return null;
  }
  const children = apiLayer.handle.stack;
  if (children.length !== API_MOUNT_ORDER.length) {
    return null;
  }
  const routes = [];
  children.forEach((child, index) => {
    const prefix = `/api/v1${API_MOUNT_ORDER[index]}`;
    for (const layer of child.handle.stack) {
      if (!layer.route) {
        continue;
      }
      const suffix = normalizeRoutePath(layer.route.path);
      const fullPath = suffix === '/' ? prefix : `${prefix}${suffix}`;
      for (const method of Object.keys(layer.route.methods ?? {})) {
        if (layer.route.methods[method] === true) {
          routes.push({ method, path: fullPath });
        }
      }
    }
  });
  return routes;
}

function specRoutes() {
  const routes = [];
  for (const [specPathKey, pathItem] of Object.entries(swaggerSpec.paths ?? {})) {
    const fullPath = `/api/v1${specPathKey}`;
    for (const method of Object.keys(pathItem ?? {})) {
      if (method === 'parameters') {
        continue;
      }
      routes.push({ method, path: fullPath });
    }
  }
  return routes;
}

export function checkDocsCoverage(app) {
  const mounted = collectMountedRoutes(app);
  if (!mounted) {
    logger.warn('No se pudo verificar la cobertura de Swagger: cambio el montaje de routers.');
    return;
  }
  const documented = specRoutes();
  const key = (route) => `${route.method.toUpperCase()} ${route.path}`;
  const documentedKeys = new Set(documented.map(key));
  const mountedKeys = new Set(mounted.map(key));
  const missing = mounted.filter((route) => !documentedKeys.has(key(route)));
  const extra = documented.filter((route) => !mountedKeys.has(key(route)));
  for (const route of missing) {
    logger.warn(`Ruta sin documentar en Swagger: ${key(route)}.`);
  }
  for (const route of extra) {
    logger.warn(`Ruta documentada que no existe en el router: ${key(route)}.`);
  }
}

export function sendSwaggerJson(req, res) {
  if (config.nodeEnv === 'development') {
    checkDocsCoverage(req.app);
  }
  res.json(swaggerSpec);
}
