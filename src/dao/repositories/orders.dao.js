import { OrderModel } from '../models/order.model.js';
import { paginateModel } from './paginate.js';

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

  async paginate(filter = {}, options = {}) {
    return paginateModel(OrderModel)(filter, { select: '-proofs -__v', ...options });
  }

  async updateById(id, data) {
    return OrderModel.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async deleteById(id) {
    return OrderModel.findByIdAndDelete(id);
  }
}

export const ordersDao = new OrdersDao();