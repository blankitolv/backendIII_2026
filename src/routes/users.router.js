import { Router } from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/users.controller.js';
import {
  uploadUserDocument,
  uploadCourierLicense,
  listUserDocuments,
  downloadDocument
} from '../controllers/documents.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { uploaderDocuments } from '../config/multer.js';
import { documentParentValidator } from '../validators/documents.validator.js';
import {
  userIdValidator,
  userCreateValidator,
  userUpdateValidator
} from '../validators/users.validator.js';

export const usersRouter = Router();

usersRouter.get('/', requireAuth, listUsers);
usersRouter.get('/:id', requireAuth, validate(userIdValidator), getUser);
usersRouter.post('/', validate(userCreateValidator), createUser);
usersRouter.put('/:id', requireAuth, validate(userUpdateValidator), updateUser);
usersRouter.delete('/:id', requireAuth, validate(userIdValidator), deleteUser);

// El permiso de propiedad no se resuelve en el router: depende del documento del padre, que
// solo se conoce leyendo la base. requireAuth alcanza y el service responde 403.
usersRouter.post(
  '/:id/documents',
  requireAuth,
  validate(documentParentValidator),
  uploaderDocuments.single('document'),
  uploadUserDocument
);

usersRouter.get('/:id/documents', requireAuth, validate(documentParentValidator), listUserDocuments);

usersRouter.get(
  '/:id/documents/:docId/download',
  requireAuth,
  (req, res, next) => {
    req.params.id = req.params.docId;
    return downloadDocument(req, res, next);
  }
);

usersRouter.post(
  '/:id/license',
  requireAuth,
  validate(documentParentValidator),
  uploaderDocuments.single('license'),
  uploadCourierLicense
);
