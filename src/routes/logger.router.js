import { Router } from 'express';
import { getRecentLogs, getErrorLogs, postLoggerTest } from '../controllers/logger.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

// Protegido con ADMIN para auditoria interna de logs.
export const loggerRouter = Router();

loggerRouter.use(requireAuth, requireRole(ROLES.ADMIN));
loggerRouter.get('/recent', getRecentLogs);
loggerRouter.get('/error-lines', getErrorLogs);
loggerRouter.post('/test', postLoggerTest);
