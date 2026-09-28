import { CustomError } from '../utils/customError.js';
import { ERROR_CODES, ERROR_STATUS } from '../constants/errors.js';
import { invalidValues, incompleteValues, duplicateResource } from '../utils/errorFactory.js';
import { logger } from '../utils/logger.js';

function statusFor(code) {
  return ERROR_STATUS[code] ?? 500;
}

export function errorMiddleware(err, req, res, _next) {
  let code = err?.code ?? ERROR_CODES.INTERNAL_SERVER_ERROR;
  let status = err?.statusCode ?? err?.status ?? statusFor(code);
  let message = err?.message;

  if (err instanceof CustomError) {
    code = err.code;
    status = err.statusCode;
    message = err.message;
  } else if (err?.name === 'ValidationError') {
    const fields = Object.keys(err.errors ?? {});
    const wrapped = fields.length ? incompleteValues(fields) : invalidValues(['body']);
    code = wrapped.code;
    status = wrapped.statusCode;
    message = wrapped.message;
  } else if (err?.name === 'CastError') {
    const wrapped = invalidValues([err.path ?? 'id']);
    code = wrapped.code;
    status = wrapped.statusCode;
    message = wrapped.message;
  } else if (err?.code === 11000 || err?.code === '11000') {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'recurso';
    const wrapped = duplicateResource(field);
    code = wrapped.code;
    status = wrapped.statusCode;
    message = wrapped.message;
  } else if (err?.code === 'LIMIT_FILE_SIZE') {
    code = ERROR_CODES.FILE_TOO_LARGE;
    status = statusFor(code);
    message = 'El archivo supera el limite permitido.';
  } else if (err?.code === 'LIMIT_UNEXPECTED_FILE') {
    code = ERROR_CODES.FILE_REQUIRED;
    status = statusFor(code);
    message = 'Se requiere un archivo en esta peticion.';
  } else if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    const wrapped = invalidValues(['body']);
    code = wrapped.code;
    status = wrapped.statusCode;
    message = 'JSON malformado en el cuerpo de la peticion.';
  } else {
    code = ERROR_CODES.INTERNAL_SERVER_ERROR;
    status = 500;
    message = 'Ocurrio un error inesperado en el servidor. Intente nuevamente mas tarde.';
  }

  if (typeof status !== 'number' || status < 400 || status > 599) {
    status = 500;
    code = ERROR_CODES.INTERNAL_SERVER_ERROR;
    message = 'Ocurrio un error inesperado en el servidor. Intente nuevamente mas tarde.';
  }

  const activeLogger = req?.logger ?? logger;
  const meta = {
    code,
    requestId: req?.logger?.requestId,
    method: req?.method,
    url: req?.originalUrl
  };
  if (err?.isOperational || status < 500) {
    activeLogger.warn(message, meta);
  } else {
    activeLogger.error(message, { ...meta, stack: err?.stack });
  }

  res.status(status).json({ status: 'error', error: code, message });
}
