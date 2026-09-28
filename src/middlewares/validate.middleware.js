import { incompleteValues, invalidValues } from '../utils/errorFactory.js';
import { isValidObjectId } from '../validators/documents.validator.js';

export function validate(schema) {
  return (req, res, next) => {
    const missing = [];
    const invalid = [];
    for (const section of ['body', 'query', 'params']) {
      const rules = schema[section];
      if (!rules) continue;
      const source = req[section] ?? {};
      for (const [field, rule] of Object.entries(rules)) {
        const value = source[field];
        if (rule.required && (value === undefined || value === null || value === '')) {
          missing.push(`${section}.${field}`);
        } else if (value !== undefined && value !== null && value !== '') {
          if (rule.enum && !rule.enum.includes(value)) {
            invalid.push(`${section}.${field}`);
          }
          if (rule.type && typeof value !== rule.type) {
            invalid.push(`${section}.${field}`);
          }
          if (rule.format === 'objectId' && !isValidObjectId(value)) {
            invalid.push(`${section}.${field}`);
          }
        }
      }
    }
    if (missing.length) {
      throw incompleteValues(missing);
    }
    if (invalid.length) {
      throw invalidValues([...new Set(invalid)]);
    }
    next();
  };
}
