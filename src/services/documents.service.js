import { documentsDao } from '../dao/repositories/documents.dao.js';

export class DocumentsService {
  constructor({ documents = documentsDao } = {}) {
    this.documents = documents;
  }

  list(query) {
    return this.documents.paginate(query);
  }

  getById(id) {
    return this.documents.findById(id);
  }

  create(data) {
    return this.documents.create(data);
  }
}

export const documentsService = new DocumentsService();
