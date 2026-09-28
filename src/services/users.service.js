import { usersDao } from '../dao/repositories/users.dao.js';
import { notFound } from '../utils/errorFactory.js';

export class UsersService {
  constructor({ users = usersDao } = {}) {
    this.users = users;
  }

  list(query) {
    return this.users.paginate(query);
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
