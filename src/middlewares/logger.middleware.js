import crypto from 'node:crypto';
import { logger } from '../utils/logger.js';

export function loggerMiddleware(req, res, next) {
  req.logger = logger;
  req.requestId = req.headers['x-request-id'] ?? crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  const started = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - started;
    req.logger.http(`${req.method} en ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`, {
      requestId: req.requestId,
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip
    });
  });
  next();
}
