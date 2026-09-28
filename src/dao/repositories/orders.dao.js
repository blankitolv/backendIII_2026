import { OrderModel } from '../models/order.model.js';

export class OrdersDao {
  async create(data) {
    return OrderModel.create(data);
  }

  async insertMany(items) {
    return OrderModel.insertMany(items);
  }

  async bulkWrite(ops) {
    return OrderModel.bulkWrite(ops);
  }

  async deleteMany(filter = {}) {
    return OrderModel.deleteMany(filter);
  }

  async findById(id) {
    return OrderModel.findById(id);
  }

  async findByTracking(trackingNumber) {
    return OrderModel.findOne({ trackingNumber });
  }

  async paginate({ page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      OrderModel.find().skip(skip).limit(limit),
      OrderModel.countDocuments()
    ]);
    return { items, total, page, limit };
  }

  async updateById(id, data) {
    return OrderModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id) {
    return OrderModel.findByIdAndDelete(id);
  }
}

export const ordersDao = new OrdersDao();
