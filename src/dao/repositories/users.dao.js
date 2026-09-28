import { UserModel } from '../models/user.model.js';
import { paginateModel } from './paginate.js';

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

  // select false borra el password de toda proyeccion por defecto; el login es el
  // unico que lo necesita y lo pide explicitamente.
  async findByEmail(email) {
    return UserModel.findOne({ email }).select('+password');
  }

  async paginate(filter = {}, options = {}) {
    return paginateModel(UserModel)(filter, { select: '-password -__v', ...options });
  }

  async updateById(id, data) {
    return UserModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id) {
    return UserModel.findByIdAndDelete(id);
  }
}

export const usersDao = new UsersDao();