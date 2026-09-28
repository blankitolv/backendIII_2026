function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function toOrderDTO(order) {
  if (!order) return null;
  const data = order.toObject ? order.toObject() : order;
  return {
    id: String(data._id ?? data.id),
    trackingNumber: data.trackingNumber,
    status: data.status,
    origin: data.origin,
    destination: data.destination,
    weightKg: data.weightKg,
    deliveryAddress: data.deliveryAddress,
    priority: data.priority,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt)
  };
}
