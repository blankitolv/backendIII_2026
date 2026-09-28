import path from 'node:path';
import { fileURLToPath } from 'node:url';
import winston from 'winston';
import { config } from '../config/config.js';
import { logLevels, logColors } from '../config/logLevels.js';
import { formatRedact } from './loggerRedact.js';

winston.addColors(logColors);

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.resolve(currentDir, '../../logs');

// Nivel y formato configurables por .env (LOG_LEVEL, LOG_FORMAT); si no se
// setean, config.js les da el default por entorno. En produccion el nivel
// base nunca baja de info, asi el debug no degrada el Event Loop.
const activeLevel = config.logLevel;

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  formatRedact()
);

function buildFormat() {
  if (config.logFormat === 'pretty') {
    return winston.format.combine(baseFormat, winston.format.colorize(), winston.format.simple());
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
