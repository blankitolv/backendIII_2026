import { authService } from '../services/auth.service.js';
import { CustomError } from '../utils/customError.js';
import { ERROR_CODES } from '../constants/errors.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new CustomError(ERROR_CODES.UNAUTHORIZED, 'Missing token');
  }
  const payload = authService.verifyToken(token);
  req.user = { id: payload.sub, role: payload.role };
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new CustomError(ERROR_CODES.FORBIDDEN, 'Forbidden');
    }
    next();
  };
}
