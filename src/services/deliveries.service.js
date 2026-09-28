import { deliveriesDao } from '../dao/repositories/deliveries.dao.js';

export class DeliveriesService {
  constructor({ deliveries = deliveriesDao } = {}) {
    this.deliveries = deliveries;
  }

  list(query) {
    return this.deliveries.paginate(query);
  }

  getById(id) {
    return this.deliveries.findById(id);
  }

  create(data) {
    return this.deliveries.create(data);
  }
}

export const deliveriesService = new DeliveriesService();
