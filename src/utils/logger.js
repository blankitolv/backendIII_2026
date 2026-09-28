import path from 'node:path';
import { fileURLToPath } from 'node:url';
import winston from 'winston';
import { config } from '../config/config.js';
import { logLevels, logColors } from '../config/logLevels.js';
import { formatRedact } from './loggerRedact.js';

winston.addColors(logColors);

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.resolve(currentDir, '../../logs');

const levelByEnv = {
  development: 'debug',
  test: 'error',
  production: 'info'
};
const activeLevel = levelByEnv[config.nodeEnv] ?? 'info';

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  formatRedact()
);

function buildFormat() {
  if (config.nodeEnv === 'development') {
    return winston.format.combine(baseFormat, winston.format.colorize(), winston.format.simple());
  }
  if (config.nodeEnv === 'test') {
    return winston.format.combine(baseFormat, winston.format.json());
  }
  return winston.format.combine(baseFormat, winston.format.json());
}

const transports = [];
try {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      format: winston.format.combine(baseFormat, winston.format.json())
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      level: activeLevel,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      format: winston.format.combine(baseFormat, winston.format.json())
    })
  );
} catch {
  // Sin catch vacio: se avisa una sola vez y la API sigue sin file transports.
  // eslint-disable-next-line no-console
  console.warn('No se pudo escribir en logs/, la API sigue sin file transports.');
}

if (config.nodeEnv === 'development') {
  transports.push(new winston.transports.Console({ format: buildFormat() }));
}

export const logger = winston.createLogger({
  levels: logLevels,
  level: activeLevel,
  format: buildFormat(),
  transports
});

logger.warning = (...args) => logger.warn(...args);
