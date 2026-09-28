import rateLimit from 'express-rate-limit';
import { config } from '../config/config.js';
import { rateLimitExceeded } from '../utils/errorFactory.js';

// factory para que el test pueda montar una instancia con limite chico sin
// tocar el limite global de la suite (que los tests llevan alto para no auto-429).
export function crearRateLimiter({ windowMs = config.rateLimit.windowMs, max = config.rateLimit.max } = {}) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: () => {
      throw rateLimitExceeded();
    }
  });
}