import { Router } from 'express';
import { health, ready } from '../controllers/health.controller.js';

export const healthRouter = Router();

healthRouter.get('/', health);
healthRouter.get('/ready', ready);