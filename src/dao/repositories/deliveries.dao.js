import { DeliveryModel } from '../models/delivery.model.js';
import { paginateModel } from './paginate.js';

export class DeliveriesDao {
  async create(data) {
    return DeliveryModel.create(data);
  }

  async insertMany(items) {
    return DeliveryModel.insertMany(items);
  }

  async bulkWrite(ops) {
    return DeliveryModel.bulkWrite(ops);
  }

  async deleteMany(filter = {}) {
    return DeliveryModel.deleteMany(filter);
  }

  async findById(id) {
    return DeliveryModel.findById(id);
  }

  async paginate(filter = {}, options = {}) {
    return paginateModel(DeliveryModel)(filter, { select: '-proofs -__v', ...options });
  }

  async updateById(id, data) {
    return DeliveryModel.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async deleteById(id) {
    return DeliveryModel.findByIdAndDelete(id);
  }
}

export const deliveriesDao = new DeliveriesDao();