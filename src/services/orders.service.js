import { ordersDao } from '../dao/repositories/orders.dao.js';
import { notFound, invalidState } from '../utils/errorFactory.js';
import { ORDER_STATUS, ORDER_TRANSITIONS } from '../constants/orderStatus.js';

export class OrdersService {
  constructor({ orders = ordersDao } = {}) {
    this.orders = orders;
  }

  list(query) {
    return this.orders.paginate(query);
  }

  async getById(id) {
    const order = await this.orders.findById(id);
    if (!order) {
      throw notFound('pedido');
    }
    return order;
  }

  create(data) {
    return this.orders.create({ ...data, status: ORDER_STATUS.CREATED });
  }

  async updateStatus(id, next) {
    const order = await this.orders.findById(id);
    if (!order) {
      throw notFound('pedido');
    }
    const allowed = ORDER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(next)) {
      throw invalidState(order.status, allowed);
    }
    return this.orders.updateById(id, { status: next });
  }
}

export const ordersService = new OrdersService();
