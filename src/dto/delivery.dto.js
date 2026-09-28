function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function toDeliveryDTO(delivery) {
  if (!delivery) return null;
  const data = delivery.toObject ? delivery.toObject() : delivery;
  return {
    id: String(data._id ?? data.id),
    order: data.order ? String(data.order) : null,
    courier: data.courier ? String(data.courier) : null,
    status: data.status,
    deliveredAt: toIso(data.deliveredAt),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt)
  };
}
