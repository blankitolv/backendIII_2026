function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function toDocumentDTO(document) {
  if (!document) return null;
  const data = document.toObject ? document.toObject() : document;
  const id = String(data._id ?? data.id);
  return {
    id,
    originalName: data.originalName,
    mimeType: data.mimeType,
    size: data.size,
    type: data.type,
    parentModel: data.parentModel,
    parentId: data.parentId ? String(data.parentId) : null,
    uploadedAt: toIso(data.uploadedAt),
    // `path` no sale nunca. El cliente descarga por esta URL, que el service valida contra
    // los permisos y contra la raiz de uploads.
    downloadUrl: `/api/v1/documents/${id}/download`
  };
}
