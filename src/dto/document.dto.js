function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function toDocumentDTO(document) {
  if (!document) return null;
  const data = document.toObject ? document.toObject() : document;
  return {
    id: String(data._id ?? data.id),
    originalName: data.originalName,
    mimeType: data.mimeType,
    size: data.size,
    type: data.type,
    parentModel: data.parentModel,
    parentId: data.parentId ? String(data.parentId) : null,
    uploadedAt: toIso(data.uploadedAt)
  };
}
