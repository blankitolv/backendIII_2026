// 24 hexadecimales, que es lo unico que acepta mongoose.Types.ObjectId. Se valida con regex y
// no importando mongoose: mongoose solo puede aparecer en src/dao/.
const OBJECT_ID = /^[a-f\d]{24}$/i;

export const isValidObjectId = (value) =>
  typeof value === 'string' && OBJECT_ID.test(value);

// Un id con formato invalido debe dar 400 y no un CastError de Mongoose traduciendose a 500:
// el service devuelve 404 solo cuando el id es un ObjectId bien formado que no existe.
export const documentIdValidator = {
  params: { id: { required: true, type: 'string', format: 'objectId' } }
};

export const documentParentValidator = {
  params: { id: { required: true, type: 'string', format: 'objectId' } }
};
