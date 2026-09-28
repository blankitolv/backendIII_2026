import { cleanDatabase } from '../helpers/db.js';

// Hook raiz: corre despues de cada test de cualquier archivo porque este
// modulo se carga con `file` en .mocharc.json. Ningun test depende del orden
// ni del estado que dejo otro.
afterEach(async () => {
  await cleanDatabase();
});
