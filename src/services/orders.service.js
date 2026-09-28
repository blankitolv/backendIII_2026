import { ordersDao } from '../dao/repositories/orders.dao.js';
import { CustomError } from '../utils/customError.js';
import { ERROR_CODES } from '../constants/errors.js';
import { ORDER_STATUS, ORDER_TRANSITIONS } from '../constants/orderStatus.js';

export class OrdersService {
  constructor({ orders = ordersDao } = {}) {
    this.orders = orders;
  }

  list(query) {
    return this.orders.paginate(query);
  }

  getById(id) {
    return this.orders.findById(id);
  }

  create(data) {
    return this.orders.create({ ...data, status: ORDER_STATUS.CREATED });
  }

  async updateStatus(id, next) {
    const order = await this.orders.findById(id);
    if (!order) {
      throw new CustomError(ERROR_CODES.NOT_FOUND, 'Order not found');
    }
    const allowed = ORDER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(next)) {
      throw new CustomError(ERROR_CODES.INVALID_STATUS, 'Invalid status transition');
    }
    return this.orders.updateById(id, { status: next });
  }
}

export const ordersService = new OrdersService();
