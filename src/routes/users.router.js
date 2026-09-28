import { Router } from 'express';
import { listUsers, getUser } from '../controllers/users.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const usersRouter = Router();

usersRouter.get('/', requireAuth, listUsers);
usersRouter.get('/:id', requireAuth, getUser);
