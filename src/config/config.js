import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];

for (const name of REQUIRED) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const RUTA_BASE = path.dirname(fileURLToPath(import.meta.url));

// RUTA_BASE apunta a src/config: suben dos niveles para llegar a la raiz del proyecto.
const PROJECT_ROOT = path.resolve(RUTA_BASE, '..', '..');

function toMimeList(raw, fallback) {
  const list = (raw ?? fallback)
    .split(',')
    .map((mime) => mime.trim())
    .filter(Boolean);
  return list.length > 0 ? list : fallback.split(',');
}

const UPLOAD_ROOT = path.resolve(PROJECT_ROOT, process.env.UPLOAD_DIR ?? 'uploads');

export const config = {
  port: Number(process.env.PORT ?? 3000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  internalToken: process.env.INTERNAL_TOKEN ?? null,
  upload: {
    // Absoluta aqui y no en el factory: es la misma para los dos uploaders, y resolverla una
    // sola vez evita que cada uno dependa del CWD con el que arrancó el proceso.
    root: UPLOAD_ROOT,
    documentsDir: path.join(UPLOAD_ROOT, 'documents'),
    proofsDir: path.join(UPLOAD_ROOT, 'proofs'),
    maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_MB ?? 5) * 1024 * 1024,
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
