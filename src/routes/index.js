import { Router } from 'express';
import { authRouter } from './auth.router.js';
import { usersRouter } from './users.router.js';
import { ordersRouter } from './orders.router.js';
import { deliveriesRouter } from './deliveries.router.js';
import { documentsRouter } from './documents.router.js';
import { mocksRouter } from './mocks.router.js';
import { healthRouter } from './health.router.js';
import { config } from '../config/config.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/deliveries', deliveriesRouter);
apiRouter.use('/documents', documentsRouter);
apiRouter.use('/health', healthRouter);

if (config.nodeEnv !== 'production') {
  apiRouter.use('/mocks', mocksRouter);
}
