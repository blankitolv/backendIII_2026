import { Router } from 'express';
import { generateMocks } from '../controllers/mocks.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { mocksValidator } from '../validators/mocks.validator.js';

export const mocksRouter = Router();

mocksRouter.post('/', validate(mocksValidator), generateMocks);
