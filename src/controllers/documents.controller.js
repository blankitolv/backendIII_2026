import { documentsService } from '../services/documents.service.js';
import { toDocumentDTO } from '../dto/document.dto.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listDocuments = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await documentsService.list(req.query);
  res.json({ status: 'success', data: { items: items.map(toDocumentDTO), meta: { page, limit, total } } });
});

export const getDocument = asyncHandler(async (req, res) => {
  const document = await documentsService.getById(req.params.id);
  res.json({ status: 'success', data: toDocumentDTO(document) });
});
