import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGINATION } from '../constants/pagination.js';
import { MOCKS_FULL_MAX } from '../constants/mockRanges.js';

const RUTA_BASE = path.dirname(fileURLToPath(import.meta.url));

// RUTA_BASE apunta a src/config: suben dos niveles para llegar a la raiz del proyecto.
// dotenv con path absoluto y no desde el CWD: la app se puede arrancar desde cualquier
// directorio y sigue leyendo el mismo .env.
const PROJECT_ROOT = path.resolve(RUTA_BASE, '..', '..');
dotenv.config({ path: path.resolve(PROJECT_ROOT, '.env') });

// Fail-fast: el mensaje nombra la variable pero jamas su valor. Un default inseguro
// no es default, por eso MONGODB_URI y JWT_SECRET no tienen fallback.
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];

for (const name of REQUIRED) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

// La variable que llega de process.env siempre es string. Sin coaccion a entero,
// un PORT invalido propagaria NaN en silencio y romperia el listener en runtime.
function toInt(raw, fallback) {
  const value = Number.parseInt(raw ?? '', 10);
  if (!Number.isNaN(value) && value > 0) {
    return value;
  }
  if (raw === undefined || raw === null || raw === '') {
    return fallback;
  }
  throw new Error(`Invalid environment variable: expected a positive integer, got "${raw}"`);
}

const NODE_ENV = process.env.NODE_ENV ?? 'development';

const LOG_LEVEL_BY_ENV = {
  development: 'debug',
  test: 'error',
  production: 'info'
};

const LOG_FORMAT_BY_ENV = {
  development: 'pretty',
  test: 'json',
  production: 'json'
};

function toMimeList(raw, fallback) {
  const list = (raw ?? fallback)
    .split(',')
    .map((mime) => mime.trim())
    .filter(Boolean);
  return list.length > 0 ? list : fallback.split(',');
}

const UPLOAD_ROOT = path.resolve(PROJECT_ROOT, process.env.UPLOAD_DIR ?? 'uploads');

export const config = {
  port: toInt(process.env.PORT, 3000),
  nodeEnv: NODE_ENV,
  mongoUri: process.env.MONGODB_URI,
  mongoUriTest: process.env.MONGODB_URI_TEST ?? null,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  internalToken: process.env.INTERNAL_TOKEN ?? null,
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  logLevel: process.env.LOG_LEVEL ?? LOG_LEVEL_BY_ENV[NODE_ENV] ?? 'info',
  logFormat: process.env.LOG_FORMAT ?? LOG_FORMAT_BY_ENV[NODE_ENV] ?? 'json',
  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 100)
  },
  pagination: {
    defaultLimit: toInt(process.env.DEFAULT_PAGE_SIZE, PAGINATION.DEFAULT_LIMIT),
    maxLimit: toInt(process.env.MAX_PAGE_SIZE, PAGINATION.MAX_LIMIT)
  },
  mocks: {
    maxAmount: toInt(process.env.MOCKS_MAX_AMOUNT, MOCKS_FULL_MAX)
  },
  upload: {
    // Absoluta aqui y no en el factory: es la misma para los dos uploaders, y resolverla una
    // sola vez evita que cada uno dependa del CWD con el que arranco el proceso.
    root: UPLOAD_ROOT,
    documentsDir: path.join(UPLOAD_ROOT, 'documents'),
    proofsDir: path.join(UPLOAD_ROOT, 'proofs'),
    maxFileSizeBytes: toInt(process.env.MAX_FILE_SIZE_MB, 5) * 1024 * 1024,
    allowedDocuments: toMimeList(
      process.env.MIME_ALLOWED_DOCUMENTS,
      'application/pdf,image/jpeg,image/png'
    ),
    allowedProofs: toMimeList(
      process.env.MIME_ALLOWED_PROOFS,
      'application/pdf,image/jpeg,image/png,application/xml'
    )
  }
};