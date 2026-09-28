import { usersDao } from '../dao/repositories/users.dao.js';
import { ordersDao } from '../dao/repositories/orders.dao.js';
import { invalidMocksAmount } from '../utils/errorFactory.js';

const MIN_MOCKS = 1;
const MAX_MOCKS = 1000;

export class MocksService {
  constructor({ users = usersDao, orders = ordersDao } = {}) {
    this.users = users;
    this.orders = orders;
  }

  assertAmount(items) {
    const total = items?.length ?? 0;
    if (total < MIN_MOCKS || total > MAX_MOCKS) {
      throw invalidMocksAmount(MIN_MOCKS, MAX_MOCKS);
    }
  }

  generateUsers(items) {
    this.assertAmount(items);
    return this.users.insertMany(items);
  }

  generateOrders(items) {
    this.assertAmount(items);
    return this.orders.insertMany(items);
  }
}

export const mocksService = new MocksService();
