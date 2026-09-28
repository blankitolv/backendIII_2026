import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { apiRouter } from './routes/index.js';
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { swaggerSpec } from './config/swagger.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(loggerMiddleware);
  app.use('/api/v1', apiRouter);
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/v1/docs.json', (req, res) => res.json(swaggerSpec));
  app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
  app.use((req, res) => {
    res.status(404).json({ status: 'error', error: 'NOT_FOUND', message: 'Route not found' });
  });
  app.use(errorMiddleware);
  return app;
}

export const app = createApp();
