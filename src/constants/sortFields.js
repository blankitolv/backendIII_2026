// Lista blanca de campos ordenables por entidad. `sort` nunca va directo a la query:
// parseSort descarta campos y sintaxis que no esten aca y devuelve un objeto vacio
// si nada pasa, para que un ?sort arbitrario no permita ordenar por campos del schema
// que no se quieren exponer.
export const SORTABLE_FIELDS = {
  user: ['name', 'email', 'role', 'createdAt', 'updatedAt'],
  order: [
    'trackingNumber',
    'status',
    'priority',
    'origin',
    'destination',
    'weightKg',
    'createdAt',
    'updatedAt'
  ],
  delivery: ['status', 'createdAt', 'updatedAt'],
  document: ['type', 'size', 'parentModel', 'parentId', 'createdAt', 'updatedAt']
};

export function parseSort(fields, raw) {
  if (!raw) {
    return {};
  }
  const result = {};
  for (const part of String(raw).split(',')) {
    const match = part.trim().match(/^(-?)([A-Za-z0-9_]+)$/);
    if (!match) {
      continue;
    }
    const direction = match[1] === '-' ? -1 : 1;
    const field = match[2];
    if (fields.includes(field)) {
      result[field] = direction;
    }
  }
  return result;
}