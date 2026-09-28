import { Router } from 'express';
import { register, login, me } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerValidator), register);
authRouter.post('/login', validate(loginValidator), login);
authRouter.get('/me', requireAuth, me);
