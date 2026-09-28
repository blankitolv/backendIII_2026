import { Router } from 'express';
import { listDeliveries, getDelivery, createDelivery } from '../controllers/deliveries.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { deliveryValidator, deliveryIdValidator } from '../validators/deliveries.validator.js';

export const deliveriesRouter = Router();

deliveriesRouter.get('/', requireAuth, listDeliveries);
deliveriesRouter.get('/:id', requireAuth, validate(deliveryIdValidator), getDelivery);
deliveriesRouter.post('/', requireAuth, validate(deliveryValidator), createDelivery);
