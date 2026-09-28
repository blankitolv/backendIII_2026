import { DocumentModel } from '../models/document.model.js';
import { normalizePagination } from '../../constants/pagination.js';

export class DocumentsDao {
  async create(data) {
    return DocumentModel.create(data);
  }

  async insertMany(items) {
    return DocumentModel.insertMany(items);
  }

  async bulkWrite(ops) {
    return DocumentModel.bulkWrite(ops);
  }

  async deleteMany(filter = {}) {
    return DocumentModel.deleteMany(filter);
  }

  async findById(id) {
    return DocumentModel.findById(id);
  }

  async paginate(query = {}) {
    const { page, limit, skip } = normalizePagination(query);
    const [items, total] = await Promise.all([
      DocumentModel.find().skip(skip).limit(limit),
      DocumentModel.countDocuments()
    ]);
    return { items, total, page, limit };
  }

  async updateById(id, data) {
    return DocumentModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id) {
    return DocumentModel.findByIdAndDelete(id);
  }
}

export const documentsDao = new DocumentsDao();
