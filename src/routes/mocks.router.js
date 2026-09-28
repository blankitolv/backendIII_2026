import { Router } from 'express';
import { generateMocks } from '../controllers/mocks.controller.js';

export const mocksRouter = Router();

mocksRouter.post('/', generateMocks);
