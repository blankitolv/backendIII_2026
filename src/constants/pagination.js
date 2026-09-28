// Paginacion de listados. El limite maximo evita que un ?limit gigante
// degrade la base; page y limit siempre vuelven como numeros.
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

export function normalizePagination(
  { page, limit } = {},
  { defaultLimit = PAGINATION.DEFAULT_LIMIT, maxLimit = PAGINATION.MAX_LIMIT } = {}
) {
  const safePage = Math.max(1, Number(page) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    maxLimit,
    Math.max(1, Number(limit) || defaultLimit)
  );
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}
