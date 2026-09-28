import { Router } from 'express';
import { listOrders, getOrder, createOrder } from '../controllers/orders.controller.js';
import { uploadOrderProof, listOrderProofs } from '../controllers/documents.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { orderValidator, orderIdValidator } from '../validators/orders.validator.js';
import { uploaderProofs } from '../config/multer.js';
import { documentParentValidator } from '../validators/documents.validator.js';

export const ordersRouter = Router();

ordersRouter.get('/', requireAuth, listOrders);
ordersRouter.get('/:id', requireAuth, validate(orderIdValidator), getOrder);
ordersRouter.post('/', requireAuth, validate(orderValidator), createOrder);

ordersRouter.post(
  '/:id/proofs',
  requireAuth,
  validate(documentParentValidator),
  uploaderProofs.single('proof'),
  uploadOrderProof
);

ordersRouter.get('/:id/proofs', requireAuth, validate(documentParentValidator), listOrderProofs);
