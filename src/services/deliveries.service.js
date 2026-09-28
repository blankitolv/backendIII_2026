import { deliveriesDao } from '../dao/repositories/deliveries.dao.js';
import { notFound } from '../utils/errorFactory.js';
import { logger } from '../utils/logger.js';

export class DeliveriesService {
  constructor({ deliveries = deliveriesDao } = {}) {
    this.deliveries = deliveries;
  }

  list(query) {
    return this.deliveries.paginate(query);
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
}

export const deliveriesService = new DeliveriesService();
