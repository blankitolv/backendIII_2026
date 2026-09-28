import { usersDao } from '../dao/repositories/users.dao.js';
import { notFound, duplicateResource } from '../utils/errorFactory.js';
import { SORTABLE_FIELDS, parseSort } from '../constants/sortFields.js';
import { hashPassword } from '../utils/hashPassword.js';

export class UsersService {
  constructor({ users = usersDao } = {}) {
    this.users = users;
  }

  list(query = {}) {
    const { page, limit, sort } = query;
    return this.users.paginate(
      {},
      { page, limit, sort: parseSort(SORTABLE_FIELDS.user, sort) }
    );
  }

  async getById(id) {
    const user = await this.users.findById(id);
    if (!user) {
      throw notFound('usuario');
    }
    return user;
  }

  async create({ name, email, password, role }) {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw duplicateResource('email');
    }
    const hashed = await hashPassword(password);
    return this.users.create({ name, email, password: hashed, role });
  }

  async update(id, data) {
    const existing = await this.users.findById(id);
    if (!existing) {
      throw notFound('usuario');
    }
    const payload = { ...data };
    if (payload.password) {
      payload.password = await hashPassword(payload.password);
    }
    return this.users.updateById(id, payload);
  }

  async delete(id) {
    const existing = await this.users.findById(id);
    if (!existing) {
      throw notFound('usuario');
    }
    await this.users.deleteById(id);
    return { id, deleted: true };
  }
}

export const usersService = new UsersService();
