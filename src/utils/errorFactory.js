import { CustomError } from './customError.js';
import { ERROR_CODES, ERROR_STATUS } from '../constants/errors.js';

function build(code, message) {
  return new CustomError(message, ERROR_STATUS[code], code);
}

export function incompleteValues(fields = []) {
  return build(
    ERROR_CODES.INCOMPLETE_VALUES,
    `Faltan campos obligatorios: ${fields.join(', ')} son requeridos.`
  );
}

export function invalidValues(fields = []) {
  return build(
    ERROR_CODES.INVALID_VALUES,
    `Valores invalidos en: ${fields.join(', ')}.`
  );
}

export function invalidState(current, allowed = []) {
  return build(
    ERROR_CODES.INVALID_STATE,
    `Transicion no permitida desde ${current}. Permitidos: ${allowed.join(', ')}.`
  );
}

export function notFound(resource = 'recurso') {
  return build(
    ERROR_CODES.RESOURCE_NOT_FOUND,
    `No se encontro ningun ${resource} con el ID especificado.`
  );
}

export function duplicateResource(field = 'recurso') {
  return build(
    ERROR_CODES.DUPLICATE_RESOURCE,
    `Ya existe un recurso con ese ${field}.`
  );
}

export function unauthorized(message = 'Credenciales invalidas o token expirado.') {
  return build(ERROR_CODES.UNAUTHORIZED, message);
}

export function forbidden(message = 'No tiene permisos para esta accion.') {
  return build(ERROR_CODES.FORBIDDEN, message);
}

export function fileRequired() {
  return build(ERROR_CODES.FILE_REQUIRED, 'Se requiere un archivo en esta peticion.');
}

export function invalidFileType(allowed = []) {
  return build(
    ERROR_CODES.INVALID_FILE_TYPE,
    `Tipo de archivo invalido. Permitidos: ${allowed.join(', ')}.`
  );
}

export function fileTooLarge(maxBytes) {
  return build(
    ERROR_CODES.FILE_TOO_LARGE,
    `El archivo supera el limite permitido de ${maxBytes} bytes.`
  );
}

export function payloadTooLarge() {
  return build(
    ERROR_CODES.PAYLOAD_TOO_LARGE,
    'El cuerpo de la peticion supera el limite permitido de 1 MB.'
  );
}

export function rateLimitExceeded() {
  return build(ERROR_CODES.RATE_LIMIT_EXCEEDED, 'Demasiadas peticiones. Intente de nuevo mas tarde.');
}

export function notReady() {
  return build(ERROR_CODES.NOT_READY, 'La base de datos no esta disponible.');
}

export function invalidMocksAmount(min, max) {
  return build(
    ERROR_CODES.INVALID_MOCKS_AMOUNT,
    `Cantidad de mocks fuera de rango. Minimo ${min}, maximo ${max}.`
  );
}

export function errorFactory(code, message) {
  return new CustomError(message ?? code, ERROR_STATUS[code] ?? 500, code);
}
