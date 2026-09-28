import { deliveriesDao } from '../dao/repositories/deliveries.dao.js';
import { notFound } from '../utils/errorFactory.js';
import { SORTABLE_FIELDS, parseSort } from '../constants/sortFields.js';
import { DELIVERY_STATUS } from '../constants/deliveryStatus.js';
import { logger } from '../utils/logger.js';

export class DeliveriesService {
  constructor({ deliveries = deliveriesDao } = {}) {
    this.deliveries = deliveries;
  }

  list(query = {}) {
    const { page, limit, sort } = query;
    return this.deliveries.paginate(
      {},
      { page, limit, sort: parseSort(SORTABLE_FIELDS.delivery, sort) }
    );
  }

  async getById(id) {
    const delivery = await this.deliveries.findById(id);
    if (!delivery) {
      throw notFound('entrega');
    }
    return delivery;
  }

  async create(data) {
    logger.debug(`Iniciando creacion de entrega para el pedido: ${data?.order}`);
    const result = await this.deliveries.create(data);
    logger.debug(`Entrega creada para el pedido: ${data?.order}.`);
    return result;
  }

  async updateStatus(id, next) {
    const delivery = await this.deliveries.findById(id);
    if (!delivery) {
      throw notFound('entrega');
    }
    const updateData = { status: next };
    if (next === DELIVERY_STATUS.DELIVERED) {
      updateData.deliveredAt = new Date();
    }
    logger.debug(`Cambio de estado de entrega ${id}: ${delivery.status} -> ${next}`);
    return this.deliveries.updateById(id, updateData);
  }

  async update(id, data) {
    if (data.status) {
      return this.updateStatus(id, data.status);
    }
    const delivery = await this.deliveries.findById(id);
    if (!delivery) {
      throw notFound('entrega');
    }
    return this.deliveries.updateById(id, data);
  }
}

export const deliveriesService = new DeliveriesService();
