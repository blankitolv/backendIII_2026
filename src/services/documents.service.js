import { documentsDao } from '../dao/repositories/documents.dao.js';
import { notFound } from '../utils/errorFactory.js';

export class DocumentsService {
  constructor({ documents = documentsDao } = {}) {
    this.documents = documents;
  }

  list(query) {
    return this.documents.paginate(query);
  }

  async getById(id) {
    const document = await this.documents.findById(id);
    if (!document) {
      throw notFound('documento');
    }
    return document;
  }

  create(data) {
    return this.documents.create(data);
  }
}

export const documentsService = new DocumentsService();
