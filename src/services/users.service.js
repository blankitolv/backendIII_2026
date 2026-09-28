import { usersDao } from '../dao/repositories/users.dao.js';

export class UsersService {
  constructor({ users = usersDao } = {}) {
    this.users = users;
  }

  list(query) {
    return this.users.paginate(query);
  }

  getById(id) {
    return this.users.findById(id);
  }
}

export const usersService = new UsersService();
