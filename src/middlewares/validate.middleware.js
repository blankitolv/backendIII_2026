import { CustomError } from '../utils/customError.js';
import { ERROR_CODES } from '../constants/errors.js';

export function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const section of ['body', 'query', 'params']) {
      const rules = schema[section];
      if (!rules) continue;
      const source = req[section] ?? {};
      for (const [field, rule] of Object.entries(rules)) {
        const value = source[field];
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push(`${section}.${field} is required`);
        }
        if (value !== undefined && rule.enum && !rule.enum.includes(value)) {
          errors.push(`${section}.${field} is invalid`);
        }
      }
    }
    if (errors.length) {
      throw new CustomError(ERROR_CODES.INVALID_DATA, errors.join(', '));
    }
    next();
  };
}
