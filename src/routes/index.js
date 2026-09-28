import { Router } from 'express';
import { authRouter } from './auth.router.js';
import { usersRouter } from './users.router.js';
import { ordersRouter } from './orders.router.js';
import { deliveriesRouter } from './deliveries.router.js';
import { documentsRouter } from './documents.router.js';
import { mocksRouter } from './mocks.router.js';
import { healthRouter } from './health.router.js';
import { loggerRouter } from './logger.router.js';
import { getLoggerTest } from '../controllers/logger.controller.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/deliveries', deliveriesRouter);
apiRouter.use('/documents', documentsRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/logger', loggerRouter);
// Mocks siempre montado detras de esOperacionInterna: en produccion el guard
// responde 403 sin tocar la base.
apiRouter.use('/mocks', mocksRouter);
