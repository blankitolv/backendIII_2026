import { documentsService } from '../services/documents.service.js';
import { toDocumentDTO } from '../dto/document.dto.js';
import { toListDTO } from '../dto/list.dto.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { fileRequired } from '../utils/errorFactory.js';
import { DOCUMENT_TYPES } from '../constants/documentTypes.js';

export const listDocuments = asyncHandler(async (req, res) => {
  // `type` es un filtro opcional sobre el listado general, no un endpoint aparte: una ruta
  // adicional por tipo multiplica el spec sin agregar capacidad real.
  const result = req.query.type
    ? await documentsService.listByType(req.query.type, req.query)
    : await documentsService.list(req.query);
  res.status(200).json({
    status: 'success',
    ...toListDTO(result.items.map(toDocumentDTO), {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    })
  });
});

export const getDocument = asyncHandler(async (req, res) => {
  const document = await documentsService.getById(req.params.id);
  res.status(200).json({ status: 'success', data: toDocumentDTO(document) });
});

async function subir(req, res, { parentModel, type }) {
  if (!req.file) {
    throw fileRequired();
  }
  const document = await documentsService.subirArchivo({
    file: req.file,
    parentModel,
    parentId: req.params.id,
    type,
    user: req.user
  });
  res.status(201).json({ status: 'success', data: toDocumentDTO(document) });
}

export const uploadUserDocument = asyncHandler((req, res) =>
  subir(req, res, { parentModel: 'User', type: DOCUMENT_TYPES.USER_DOCUMENT })
);

export const uploadOrderProof = asyncHandler((req, res) =>
  subir(req, res, { parentModel: 'Order', type: DOCUMENT_TYPES.DELIVERY_PROOF })
);

export const uploadDeliveryProof = asyncHandler((req, res) =>
  subir(req, res, { parentModel: 'Delivery', type: DOCUMENT_TYPES.DELIVERY_PROOF })
);

export const uploadCourierLicense = asyncHandler((req, res) =>
  subir(req, res, { parentModel: 'User', type: DOCUMENT_TYPES.COURIER_LICENSE })
);

function respondList(res, result) {
  res.status(200).json({
    status: 'success',
    ...toListDTO(result.items.map(toDocumentDTO), {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    })
  });
}

export const listUserDocuments = asyncHandler(async (req, res) => {
  const result = await documentsService.listByParent('User', req.params.id, req.query);
  respondList(res, result);
});

export const listOrderProofs = asyncHandler(async (req, res) => {
  const result = await documentsService.listByParent('Order', req.params.id, req.query);
  respondList(res, result);
});

export const listDeliveryProofs = asyncHandler(async (req, res) => {
  const result = await documentsService.listByParent('Delivery', req.params.id, req.query);
  respondList(res, result);
});

export const downloadDocument = asyncHandler(async (req, res) => {
  const { document, resolved } = await documentsService.descargarArchivo(req.params.id, req.user);
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Length', document.size);
  // Las comillas y barras invertidas se sacan del nombre original: van dentro de una cabecera
  // y un nombre con comillas allowiria inyectar otro header de Content-Disposition.
  const safeName = String(document.originalName).replace(/["\\]/g, '');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.sendFile(resolved);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  await documentsService.eliminar(req.params.id, req.user);
  res.status(200).json({ status: 'success', data: { id: req.params.id, deleted: true } });
});

