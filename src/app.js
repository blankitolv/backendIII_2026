import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { swaggerRouter, sendSwaggerJson } from './config/swagger.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
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
