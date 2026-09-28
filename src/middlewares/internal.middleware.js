import { config } from '../config/config.js';
import { forbidden } from '../utils/errorFactory.js';

// Guardia de operacion interna (definicion final en Plan 08). Hoy: en produccion
// siempre niega con 403; si INTERNAL_TOKEN esta configurado exige el header
// x-internal-token; sin token configurado permite fuera de produccion.
export function esOperacionInterna() {
  return (req, res, next) => {
    if (config.nodeEnv === 'production') {
      throw forbidden('Operacion no disponible en produccion.');
    }
    if (config.internalToken) {
      const presented = req.headers['x-internal-token'];
      if (presented !== config.internalToken) {
        throw forbidden('Operacion interna no autorizada.');
      }
    }
    next();
  };
}
