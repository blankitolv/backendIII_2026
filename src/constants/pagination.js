// Paginacion de listados. El limite maximo evita que un ?limit gigante
// degrade la base; page y limit siempre vuelven como numeros.
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

export function normalizePagination({ page, limit } = {}) {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, Number(limit) || PAGINATION.DEFAULT_LIMIT)
  );
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}
