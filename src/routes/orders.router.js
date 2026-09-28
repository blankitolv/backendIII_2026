import { Router } from 'express';
import { listOrders, getOrder, createOrder } from '../controllers/orders.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { orderValidator, orderIdValidator } from '../validators/orders.validator.js';

export const ordersRouter = Router();

ordersRouter.get('/', requireAuth, listOrders);
ordersRouter.get('/:id', requireAuth, validate(orderIdValidator), getOrder);
ordersRouter.post('/', requireAuth, validate(orderValidator), createOrder);
