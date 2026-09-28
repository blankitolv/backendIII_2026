import { Router } from 'express';
import { listDocuments, getDocument } from '../controllers/documents.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const documentsRouter = Router();

documentsRouter.get('/', requireAuth, listDocuments);
documentsRouter.get('/:id', requireAuth, getDocument);
