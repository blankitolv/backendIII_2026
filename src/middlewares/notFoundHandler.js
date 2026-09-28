import { ERROR_CODES, ERROR_STATUS } from '../constants/errors.js';

export function notFoundHandler(req, res, _next) {
  res.status(ERROR_STATUS[ERROR_CODES.RESOURCE_NOT_FOUND]).json({
    status: 'error',
    error: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: 'No se encontro la ruta solicitada.'
  });
}
