import { timingSafeEqual } from 'node:crypto';
import { config } from '../config/config.js';
import { forbidden, unauthorized } from '../utils/errorFactory.js';

// comparar dos strings sin filtrar su largo por la duracion: timingSafeEqual
// lanza si los buffers difieren en largo, asi que el largo se descarta antes.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

// Guardia de operacion interna: mocks y logger solo corren fuera de produccion,
// o en produccion si el request trae x-internal-token valido. Token presentado y
// no valido siempre es 401; produccion sin token configurado es 403, porque sin
// INTERNAL_TOKEN no hay forma de autorizar nada y configurarlo a medias es un error.
export function esOperacionInterna() {
  return (req, res, next) => {
    const presented = req.headers['x-internal-token'];
    if (safeEqual(presented, config.internalToken)) {
      return next();
    }
    if (config.nodeEnv === 'production') {
      return config.internalToken
        ? next(unauthorized('Token interno invalido.'))
        : next(forbidden('Operacion no disponible en produccion sin INTERNAL_TOKEN.'));
    }
    if (presented !== undefined) {
      return next(unauthorized('Token interno invalido.'));
    }
    return next();
  };
}