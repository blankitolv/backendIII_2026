import { Router } from 'express';
import { listOrders, getOrder, createOrder } from '../controllers/orders.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const ordersRouter = Router();

ordersRouter.get('/', requireAuth, listOrders);
ordersRouter.get('/:id', requireAuth, getOrder);
ordersRouter.post('/', requireAuth, createOrder);
