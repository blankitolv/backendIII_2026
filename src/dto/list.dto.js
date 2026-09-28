// Contenedor de listados paginados. `data` es el array y `meta` su descripcion:
// formato estandarizado que heredan todos los listados.
export function toListDTO(items, { page, limit, total, totalPages }) {
  return {
    data: items,
    meta: { page, limit, total, totalPages }
  };
}