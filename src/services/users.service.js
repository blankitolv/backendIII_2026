import { usersDao } from '../dao/repositories/users.dao.js';
import { notFound } from '../utils/errorFactory.js';
import { SORTABLE_FIELDS, parseSort } from '../constants/sortFields.js';

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
}

export const usersService = new UsersService();
