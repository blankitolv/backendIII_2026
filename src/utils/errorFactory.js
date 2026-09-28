import { CustomError } from './customError.js';

export function errorFactory(code, message) {
  return new CustomError(code, message);
}
