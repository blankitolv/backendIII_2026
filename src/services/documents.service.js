import { documentsDao } from '../dao/repositories/documents.dao.js';
import { notFound } from '../utils/errorFactory.js';
import { logger } from '../utils/logger.js';

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

  async create(data) {
    logger.debug(
      `Archivo recibido: ${data?.originalName ?? data?.fileName} (${data?.size ?? 0} bytes, ${data?.mimeType ?? data?.mimetype}).`
    );
    return this.documents.create(data);
  }
}

export const documentsService = new DocumentsService();
