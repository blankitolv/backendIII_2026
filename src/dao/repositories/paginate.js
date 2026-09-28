import { normalizePagination } from '../../constants/pagination.js';
import { config } from '../../config/config.js';

// Conexion entre mongoose-paginate-v2 y el DAO: el plugin devuelve un conteo
// global de documentos (totalDocs) y la cantidad de paginas, y aca se normaliza
// a { items, total, totalPages, page, limit }, que es lo que el service usa.
export function paginateModel(Model) {
  return async (filter = {}, { page, limit, sort, select } = {}) => {
    const { page: safePage, limit: safeLimit } = normalizePagination(
      { page, limit },
      config.pagination
    );
    const result = await Model.paginate(filter, {
      page: safePage,
      limit: safeLimit,
      sort,
      select,
      lean: true,
      customLabels: { docs: 'items', totalDocs: 'total' }
    });
    return {
      items: result.items,
      total: result.total,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit
    };
  };
}