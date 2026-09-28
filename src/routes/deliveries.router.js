import { Router } from 'express';
import { listDeliveries, getDelivery, createDelivery } from '../controllers/deliveries.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const deliveriesRouter = Router();

deliveriesRouter.get('/', requireAuth, listDeliveries);
deliveriesRouter.get('/:id', requireAuth, getDelivery);
deliveriesRouter.post('/', requireAuth, createDelivery);
