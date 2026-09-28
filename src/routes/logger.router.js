import { Router } from 'express';
import { getRecentLogs, getErrorLogs, postLoggerTest } from '../controllers/logger.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

// Protegido con ADMIN hasta que el Plan 03 defina el middleware de operacion interna.
export const loggerRouter = Router();

loggerRouter.use(requireAuth, requireRole(ROLES.ADMIN));
loggerRouter.get('/recent', getRecentLogs);
loggerRouter.get('/error-lines', getErrorLogs);
loggerRouter.post('/test', postLoggerTest);
