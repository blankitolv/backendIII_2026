import { deliveriesDao } from '../dao/repositories/deliveries.dao.js';
import { notFound } from '../utils/errorFactory.js';

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

  create(data) {
    return this.deliveries.create(data);
  }
}

export const deliveriesService = new DeliveriesService();
