import { DocumentModel } from '../models/document.model.js';
import { paginateModel } from './paginate.js';

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

  // El path es un campo sensible aunque el DTO lo oculte: los listados no lo
  // traen para que un lean mal mapeado no lo filtre.
  async paginate(filter = {}, options = {}) {
    return paginateModel(DocumentModel)(filter, { select: '-path -__v', ...options });
  }

  async paginateByFilter(filter = {}, query = {}) {
    return this.paginate(filter, query);
  }

  async listByType(type, query = {}) {
    return this.paginate({ type }, query);
  }

  async listByParent(parentModel, parentId, query = {}) {
    return this.paginate({ parentModel, parentId }, query);
  }

  async updateById(id, data) {
    return DocumentModel.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async deleteById(id) {
    return DocumentModel.findByIdAndDelete(id);
  }
}

export const documentsDao = new DocumentsDao();