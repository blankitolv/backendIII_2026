import { authService } from '../services/auth.service.js';
import { unauthorized, forbidden } from '../utils/errorFactory.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw unauthorized('Credenciales invalidas o token expirado.');
  }
  const payload = authService.verifyToken(token);
  req.user = { id: payload.sub, role: payload.role };
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw forbidden();
    }
    next();
  };
}
