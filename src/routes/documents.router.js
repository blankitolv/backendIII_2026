import { Router } from 'express';
import {
  listDocuments,
  getDocument,
  downloadDocument,
  deleteDocument
} from '../controllers/documents.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { documentIdValidator } from '../validators/documents.validator.js';
import { ROLES } from '../constants/roles.js';

export const documentsRouter = Router();

// Rutas planas sobre el propio recurso documento. Las rutas anidadas de subida viven en los
// routers de su padre (users, orders, deliveries): alli el prefijo ya existe y el path de la
// ruta queda completo sin volver a montarlo.
documentsRouter.get('/', requireAuth, listDocuments);
documentsRouter.get('/:id', requireAuth, validate(documentIdValidator), getDocument);
documentsRouter.get('/:id/download', requireAuth, validate(documentIdValidator), downloadDocument);
// Borrar un documento es destructivo y puede dejar huerfano un comprobante asociado: solo ADMIN.
documentsRouter.delete(
  '/:id',
  requireAuth,
  requireRole(ROLES.ADMIN),
  validate(documentIdValidator),
  deleteDocument
);
