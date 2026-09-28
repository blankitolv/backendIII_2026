import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';
import { config } from './config/config.js';
import { crearRateLimiter } from './middlewares/rateLimit.middleware.js';
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { swaggerRouter, sendSwaggerJson } from './config/swagger.js';

export function createApp() {
  const app = express();

  // Detras de un proxy/ingress express-rate-limit necesita el IP real, si no la
  // limita por la IP del proxy y todas las requests comparten el bucket.
  app.set('trust proxy', 1);

  const corsOrigin =
    config.corsOrigin === '*'
      ? '*'
      : config.corsOrigin.split(',').map((origin) => origin.trim());
  app.use(cors({ origin: corsOrigin }));

  // Límite de body: un payload de 100 MB no tiene negocio que lo pida y el JSON
  // se parsea completo antes de llegar a las rutas.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(crearRateLimiter());

  app.use(loggerMiddleware);
  app.use('/api/v1', apiRouter);
  // UI interactiva en las dos rutas: la consigna cita /api/docs y el
  // versionado del proyecto usa /api/v1. El JSON plano sale del mismo
  // objeto en memoria, por eso ambas respuestas son identicas.
  app.use('/api/v1/docs', swaggerRouter);
  app.use('/api/docs', swaggerRouter);
  app.get('/api/v1/docs.json', sendSwaggerJson);
  app.get('/api/docs.json', sendSwaggerJson);
  app.use(notFoundHandler);
  app.use(errorMiddleware);
  return app;
}

export const app = createApp();