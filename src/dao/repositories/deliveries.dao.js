import { DeliveryModel } from '../models/delivery.model.js';
import { normalizePagination } from '../../constants/pagination.js';

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

  async paginate(query = {}) {
    const { page, limit, skip } = normalizePagination(query);
    const [items, total] = await Promise.all([
      DeliveryModel.find().skip(skip).limit(limit),
      DeliveryModel.countDocuments()
    ]);
    return { items, total, page, limit };
  }

  async updateById(id, data) {
    return DeliveryModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id) {
    return DeliveryModel.findByIdAndDelete(id);
  }
}

export const deliveriesDao = new DeliveriesDao();
