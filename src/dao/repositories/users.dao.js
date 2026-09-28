import { UserModel } from '../models/user.model.js';
import { normalizePagination } from '../../constants/pagination.js';

export class UsersDao {
  async create(data) {
    return UserModel.create(data);
  }

  async insertMany(items) {
    return UserModel.insertMany(items);
  }

  async bulkWrite(ops) {
    return UserModel.bulkWrite(ops);
  }

  async deleteMany(filter = {}) {
    return UserModel.deleteMany(filter);
  }

  async findById(id) {
    return UserModel.findById(id);
  }

  async findByEmail(email) {
    return UserModel.findOne({ email });
  }

  async paginate(query = {}) {
    const { page, limit, skip } = normalizePagination(query);
    const [items, total] = await Promise.all([
      UserModel.find().skip(skip).limit(limit),
      UserModel.countDocuments()
    ]);
    return { items, total, page, limit };
  }

  async updateById(id, data) {
    return UserModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id) {
    return UserModel.findByIdAndDelete(id);
  }
}

export const usersDao = new UsersDao();
