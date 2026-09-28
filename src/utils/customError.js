import { ERROR_CODES, ERROR_STATUS } from '../constants/errors.js';

// Plan signature: new CustomError(message, statusCode, code, details).
// Legacy tolerance: new CustomError(code, message) from Sesion 01 still works.
export class CustomError extends Error {
  constructor(message, statusCode, code, details) {
    if (
      typeof message === 'string' &&
      Object.values(ERROR_CODES).includes(message) &&
      typeof statusCode === 'string'
    ) {
      super(statusCode);
      this.code = message;
      this.statusCode = ERROR_STATUS[message] ?? 500;
      this.details = undefined;
    } else {
      super(message ?? code ?? 'Error');
      this.code = code ?? ERROR_CODES.INTERNAL_SERVER_ERROR;
      this.statusCode = statusCode ?? ERROR_STATUS[this.code] ?? 500;
      this.details = details;
    }
    this.name = 'CustomError';
    this.status = this.statusCode;
    this.isOperational = true;
  }
}

export { ERROR_CODES };
