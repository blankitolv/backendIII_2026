import { DeliveryModel } from '../models/delivery.model.js';

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

  async paginate({ page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
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
