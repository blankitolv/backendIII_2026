import { ordersDao } from '../dao/repositories/orders.dao.js';
import { notFound, invalidState } from '../utils/errorFactory.js';
import { ORDER_STATUS, ORDER_TRANSITIONS } from '../constants/orderStatus.js';
import { SORTABLE_FIELDS, parseSort } from '../constants/sortFields.js';
import { logger } from '../utils/logger.js';

export class OrdersService {
  constructor({ orders = ordersDao } = {}) {
    this.orders = orders;
  }

  list(query = {}) {
    const { page, limit, sort } = query;
    return this.orders.paginate(
      {},
      { page, limit, sort: parseSort(SORTABLE_FIELDS.order, sort) }
    );
  }

  async getById(id) {
    const order = await this.orders.findById(id);
    if (!order) {
      throw notFound('pedido');
    }
    return order;
  }

  async create(data) {
    logger.debug(`Iniciando creacion de envio para el user: ${data?.user}`);
    const result = await this.orders.create({ ...data, status: ORDER_STATUS.CREATED });
    logger.debug(`Envio creado con tracking ${result?.trackingNumber}`);
    return result;
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
    logger.debug(`Cambio de estado de envio ${id}: ${order.status} -> ${next}`);
    return this.orders.updateById(id, { status: next });
  }
}

export const ordersService = new OrdersService();
