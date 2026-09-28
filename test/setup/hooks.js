import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cleanDatabase } from '../helpers/db.js';

// `src/config/config.js` lee UPLOAD_DIR al importarse y los uploaders de Multer se crean en ese
// momento, asi que la variable tiene que estar puesta antes de que se cargue cualquier modulo de
// `src/`. Por eso se resuelve aqui y no en un `before` del archivo de tests. Apunta al temporal del
// sistema para que la suite no escriba binarios en el repo.
const UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'shipnow-uploads-'));
process.env.UPLOAD_DIR = UPLOAD_DIR;

// Los binarios se limpian junto con la base. Si no, cada test que sube un archivo deja el
// temporal creciendo durante la suite y el chequeo final de "uploads/ sin basura" no distinguiria
// un archivo huerfano de uno que subio el test anterior.
// Se resuelve la ruta desde `process.env` y no importando `config`: los imports de este modulo se
// evaluan antes de su cuerpo, y `config` leeria la variable todavia sin asignar.
function cleanUploads() {
  for (const sub of ['documents', 'proofs']) {
    const dir = path.join(UPLOAD_DIR, sub);
    fs.rmSync(dir, { recursive: true, force: true });
    // Se recrea porque los uploaders se construyen una sola vez, al importar `config`, y su
    // `destination` no sabe crear el directorio en cada request.
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Hook raiz: corre despues de cada test de cualquier archivo porque este
// modulo se carga con `file` en .mocharc.json. Ningun test depende del orden
// ni del estado que dejo otro.
afterEach(async () => {
  await cleanDatabase();
  cleanUploads();
});

after(() => {
  fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
});
