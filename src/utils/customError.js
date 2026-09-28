import { ERROR_CODES, ERROR_STATUS } from '../constants/errors.js';

export class CustomError extends Error {
  constructor(code, message) {
    super(message ?? code);
    this.name = 'CustomError';
    this.code = code;
    this.status = ERROR_STATUS[code] ?? 500;
  }
}

export function createError(code, message) {
  return new CustomError(code, message ?? code);
}

export { ERROR_CODES };
