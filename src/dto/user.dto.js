function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function toUserDTO(user) {
  if (!user) return null;
  const data = user.toObject ? user.toObject() : user;
  return {
    id: String(data._id ?? data.id),
    name: data.name,
    email: data.email,
    role: data.role,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt)
  };
}
