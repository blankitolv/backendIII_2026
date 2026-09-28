import fs from 'node:fs/promises';
import { resolveInsideUploadRoot } from '../config/multer.js';
import { documentsDao } from '../dao/repositories/documents.dao.js';
import { usersDao } from '../dao/repositories/users.dao.js';
import { ordersDao } from '../dao/repositories/orders.dao.js';
import { deliveriesDao } from '../dao/repositories/deliveries.dao.js';
import { ROLES } from '../constants/roles.js';
import { DOCUMENT_TYPES } from '../constants/documentTypes.js';
import { SORTABLE_FIELDS, parseSort } from '../constants/sortFields.js';
import { forbidden, notFound } from '../utils/errorFactory.js';
import { logger } from '../utils/logger.js';

// Cada padre declara que campo lo referencia, que campo apunta a su propietario y como se llama
// en la respuesta de error. La clave es el nombre del modelo, con mayuscula, que es lo que guarda
// `parentModel` en la base y lo que ya usan la factory de tests y el ejemplo del spec.
// `owner: null` significa que el padre es su propio propietario.
const PARENTS = {
  User: { dao: () => usersDao, field: 'documents', owner: null, label: 'usuario' },
  Order: { dao: () => ordersDao, field: 'proofs', owner: 'user', label: 'envio' },
  Delivery: { dao: () => deliveriesDao, field: 'proofs', owner: 'courier', label: 'entrega' }
};

export class DocumentsService {
  constructor({ documents = documentsDao, parents = PARENTS } = {}) {
    this.documents = documents;
    this.parents = parents;
  }

  list(query = {}) {
    return this.documents.paginate({}, this.orderingOptions(query));
  }

  listByType(type, query = {}) {
    return this.documents.listByType(type, this.orderingOptions(query));
  }

  listByParent(parentModel, parentId, query = {}) {
    return this.documents.listByParent(parentModel, parentId, this.orderingOptions(query));
  }

  orderingOptions({ page, limit, sort } = {}) {
    return { page, limit, sort: parseSort(SORTABLE_FIELDS.document, sort) };
  }

  async getById(id) {
    const document = await this.documents.findById(id);
    if (!document) {
      throw notFound('documento');
    }
    return document;
  }

  async loadParent(parentModel, parentId) {
    const parent = this.parents[parentModel];
    if (!parent) {
      throw notFound('recurso padre');
    }
    const found = await parent.dao().findById(parentId);
    if (!found) {
      throw notFound(parent.label);
    }
    return { found, parent };
  }

  // El propietario no es siempre el mismo campo: un pedido pertenece al usuario que lo creo
  // y una entrega al repartidor asignado. Sin esto, `Delivery` (que no tiene `user`) caeria en
  // el `_id` de la entrega y ningun repartidor podria subir su propio comprobante.
  ownerIdOf(parent, parentModel) {
    const { owner } = this.parents[parentModel];
    if (!owner) return parent._id;
    const value = parent[owner];
    return value?._id ?? value ?? null;
  }

  // ADMIN sube a cualquiera; el resto solo a lo suyo. Va en el service y no en el router porque
  // necesita el documento del padre, que solo se conoce despues de leer la base.
  assertCanWrite(parent, parentModel, user) {
    if (!user || user.role === ROLES.ADMIN) return;
    if (String(this.ownerIdOf(parent, parentModel)) !== String(user.id)) {
      throw forbidden('Solo puede subir archivos a sus propios recursos.');
    }
  }

  // La licencia solo tiene sentido sobre un repartidor. Aceptarla sobre cualquier otro rol deja
  // metadatos que ninguna consulta de negocio puede usar, asi que se rechaza antes de escribir.
  // Aplica tambien a ADMIN: puede subir a cualquiera, pero no a un rol que no sea repartidor.
  assertParentRole(parent, type) {
    if (type === DOCUMENT_TYPES.COURIER_LICENSE && parent.role !== ROLES.COURIER) {
      throw forbidden('La licencia solo se puede subir a un repartidor.');
    }
  }

  // Multer escribe el archivo antes de que este service vea la peticion: desde aca en adelante
  // cualquier fallo tiene que borrar el binario, Includedo un 404 o un 403. Por eso la
  // validacion del padre va dentro del try y no antes.
  async subirArchivo({ file, parentModel, parentId, type, user }) {
    let created;
    try {
      const { found, parent } = await this.loadParent(parentModel, parentId);
      this.assertCanWrite(found, parentModel, user);
      this.assertParentRole(found, type);

      created = await this.documents.create({
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedBy: user.id,
        parentModel,
        parentId,
        type
      });
      // Operador de Mongo en vez de reescribir el array leido: dos subidas simultaneas al mismo
      // padre pueden pisarse y dejar una referencia huerfana. `$addToSet` no pierde ninguna.
      await parent.dao().updateById(parentId, { $addToSet: { [parent.field]: created._id } });
    } catch (error) {
      // Si el documento llego a crearse, tambien hay que borrar el metadato: un registro sin
      // archivo ni referencia en el padre no lo puede usar nadie.
      if (created) {
        await this.documents.deleteById(created._id);
      }
      await this.borrarArchivoDelDisco(file.path);
      throw error;
    }

    logger.info(
      `Documento ${created._id} subido como ${type} sobre ${parentModel} ${parentId}.`
    );
    return created;
  }

  async descargarArchivo(id, user) {
    const document = await this.getById(id);
    this.assertCanRead(document, user);
    const resolved = resolveInsideUploadRoot(document.path);
    if (!resolved) {
      throw notFound('archivo');
    }
    try {
      await fs.access(resolved);
    } catch {
      // Metadato sin binario: 404 y no 500, porque desde el punto de vista del cliente el
      // documento no existe aunque el registro siga en la base.
      throw notFound('archivo');
    }
    return { document, resolved };
  }

  assertCanRead(document, user) {
    if (!user || user.role === ROLES.ADMIN) return;
    if (String(document.uploadedBy) !== String(user.id)) {
      throw forbidden('No tiene permisos para acceder a este documento.');
    }
  }

  async eliminar(id, user) {
    const document = await this.getById(id);
    this.assertCanRead(document, user);
    const parent = this.parents[document.parentModel];
    if (parent && document.parentId) {
      await parent.dao().updateById(document.parentId, {
        $pull: { [parent.field]: document._id }
      });
    }
    await this.borrarArchivoDelDisco(document.path);
    return this.documents.deleteById(id);
  }

  // ENOENT no es error: el metadato se borra igual y no vale la pena fallar el DELETE.
  async borrarArchivoDelDisco(absolutePath) {
    const resolved = resolveInsideUploadRoot(absolutePath);
    if (!resolved) return false;
    try {
      await fs.unlink(resolved);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.warn(`No se pudo borrar el archivo ${resolved}: ${error.message}`);
      }
      return false;
    }
  }
}

export const documentsService = new DocumentsService();
