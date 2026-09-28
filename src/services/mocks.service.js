import { usersDao } from '../dao/repositories/users.dao.js';
import { ordersDao } from '../dao/repositories/orders.dao.js';

export class MocksService {
  constructor({ users = usersDao, orders = ordersDao } = {}) {
    this.users = users;
    this.orders = orders;
  }

  generateUsers(items) {
    return this.users.insertMany(items);
  }

  generateOrders(items) {
    return this.orders.insertMany(items);
  }
}

export const mocksService = new MocksService();
