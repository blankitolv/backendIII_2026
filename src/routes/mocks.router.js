import { Router } from 'express';
import {
  generateData,
  generateUsers,
  generateOrders,
  generateDeliveries,
  generateFull,
  getMockingUsers,
  getMockingOrders,
  clearMocks
} from '../controllers/mocks.controller.js';
import { esOperacionInterna } from '../middlewares/internal.middleware.js';

export const mocksRouter = Router();

mocksRouter.use(esOperacionInterna());
mocksRouter.get('/mockingusers', getMockingUsers);
mocksRouter.get('/mockingorders', getMockingOrders);
mocksRouter.post('/generateData', generateData);
mocksRouter.post('/users', generateUsers);
mocksRouter.post('/orders', generateOrders);
mocksRouter.post('/deliveries', generateDeliveries);
mocksRouter.post('/full', generateFull);
mocksRouter.delete('/', clearMocks);
