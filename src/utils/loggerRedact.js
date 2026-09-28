import winston from 'winston';

const SENSITIVE_KEYS = new Set(
  [
    'password',
    'passwordhash',
    'token',
    'authorization',
    'apikey',
    'secret',
    'mongouri',
    'connectionstring',
    'tarjeta',
    'dni',
    'document',
    'cvv',
    'telefono'
  ].map((key) => key.toLowerCase())
);

function redactValue(value, seen = new Set()) {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, seen));
  }
  if (value !== null && typeof value === 'object') {
    if (seen.has(value)) {
      return value;
    }
    seen.add(value);
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = redactValue(nested, seen);
      }
    }
    return out;
  }
  return value;
}

export function formatRedact() {
  // Se muta y devuelve el mismo info para no perder los simbolos internos de
  // Winston (LEVEL, MESSAGE, SPLAT): devolver un objeto nuevo hace que los
  // transports descarten el log en silencio.
  return winston.format((info) => {
    for (const key of Object.keys(info)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        info[key] = '[REDACTED]';
      } else {
        info[key] = redactValue(info[key]);
      }
    }
    return info;
  })();
}

export const SENSITIVE_LOG_KEYS = [...SENSITIVE_KEYS];
