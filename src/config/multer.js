import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { config } from './config.js';
import { invalidFileType } from '../utils/errorFactory.js';

const EXTENSION_BY_MIME = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/xml': '.xml',
  'application/xml': '.xml'
};

export function extensionForMime(mimeType) {
  return EXTENSION_BY_MIME[mimeType] ?? '';
}

/**
 * Resuelve la ruta absoluta de un archivo guardado y confirma que sigue dentro de `config.upload.root`.
 * Un `path` guardado en la base es dato, no confianza: sin esta comprobación, un documento
 * manipulado apuntaría a cualquier archivo del sistema.
 */
export function resolveInsideUploadRoot(absolutePath) {
  const resolved = path.resolve(absolutePath);
  const relative = path.relative(config.upload.root, resolved);
  const escapes =
    relative.startsWith('..') || path.isAbsolute(relative) || relative === '';
  return escapes ? null : resolved;
}

export function crearUploader({ destino, mimePermitidos, limiteBytes }) {
  const permitidos = new Set(mimePermitidos);

  // Un repo recien clonado no trae las carpetas de uploads: se crean al armar el middleware
  // y no a mano, asi nadie tiene que acordarse.
  fs.mkdirSync(destino, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination: destino,
      filename: (_req, file, cb) => {
        // El nombre original nunca se usa como ruta: trae separadores y caracteres de control.
        const ext = extensionForMime(file.mimetype) || path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${randomUUID()}${ext}`);
      }
    }),
    limits: { fileSize: limiteBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!permitidos.has(file.mimetype)) {
        cb(invalidFileType([...permitidos]));
        return;
      }
      cb(null, true);
    }
  });
}

export const uploaderDocuments = crearUploader({
  destino: config.upload.documentsDir,
  mimePermitidos: config.upload.allowedDocuments,
  limiteBytes: config.upload.maxFileSizeBytes
});

export const uploaderProofs = crearUploader({
  destino: config.upload.proofsDir,
  mimePermitidos: config.upload.allowedProofs,
  limiteBytes: config.upload.maxFileSizeBytes
});
