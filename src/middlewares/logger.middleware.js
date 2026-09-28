import { logger } from '../utils/logger.js';

export function loggerMiddleware(req, res, next) {
  req.logger = logger.child({ requestId: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
  const started = Date.now();
  res.on('finish', () => {
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      durationMs: Date.now() - started
    });
  });
  next();
}
