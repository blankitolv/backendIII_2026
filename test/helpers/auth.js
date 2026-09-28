import request from 'supertest';
import { app } from '../../src/app.js';
import { UserModel } from '../../src/dao/models/user.model.js';
import { hashPassword } from '../../src/utils/hashPassword.js';
import { buildUser } from './factories.js';

// Crea un usuario directo en BD (con clave hasheada) y devuelve su token
// via login real. Asi los tests autenticados no dependen del endpoint de
// registro salvo los que lo prueban a proposito.
export async function createUserAndToken(overrides = {}) {
  const raw = buildUser(overrides);
  await UserModel.create({ ...raw, password: await hashPassword(raw.password) });
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: raw.email, password: raw.password });
  return { token: login.body.data.token, user: login.body.data.user, password: raw.password };
}
