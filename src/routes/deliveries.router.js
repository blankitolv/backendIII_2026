import { Router } from 'express';
import { listDeliveries, getDelivery, createDelivery } from '../controllers/deliveries.controller.js';
import { uploadDeliveryProof, listDeliveryProofs } from '../controllers/documents.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { deliveryValidator, deliveryIdValidator } from '../validators/deliveries.validator.js';
import { uploaderProofs } from '../config/multer.js';
import { documentParentValidator } from '../validators/documents.validator.js';

export const deliveriesRouter = Router();

deliveriesRouter.get('/', requireAuth, listDeliveries);
deliveriesRouter.get('/:id', requireAuth, validate(deliveryIdValidator), getDelivery);
deliveriesRouter.post('/', requireAuth, validate(deliveryValidator), createDelivery);

deliveriesRouter.post(
  '/:id/proofs',
  requireAuth,
  validate(documentParentValidator),
  uploaderProofs.single('proof'),
  uploadDeliveryProof
);

deliveriesRouter.get('/:id/proofs', requireAuth, validate(documentParentValidator), listDeliveryProofs);
