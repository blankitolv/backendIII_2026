import winston from 'winston';
import { config } from '../config/config.js';

const level = config.nodeEnv === 'test' ? 'warn' : 'debug';

export const logger = winston.createLogger({
  level,
  levels: { fatal: 0, error: 1, warn: 2, info: 3, http: 4, debug: 5 },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});
