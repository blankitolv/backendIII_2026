import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserModel } from '../../src/dao/models/user.model.js';
import { OrderModel } from '../../src/dao/models/order.model.js';
import { DeliveryModel } from '../../src/dao/models/delivery.model.js';
import { DocumentModel } from '../../src/dao/models/document.model.js';

let mongo = null;
let users = 0;

export async function testUri() {
  return mongo?.getUri() ?? null;
}

export async function cleanDatabase() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }
  await Promise.all([
    UserModel.deleteMany({}),
    OrderModel.deleteMany({}),
    DeliveryModel.deleteMany({}),
    DocumentModel.deleteMany({})
  ]);
}

// Servidor de memoria compartido con conteo de referencias: funciona tanto
// al correr la suite completa como un archivo suelto, sin conexiones
// colgadas en ningun caso.
export async function useTestDatabase() {
  if (!mongo) {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }
  users += 1;
}

export async function releaseTestDatabase() {
  users = Math.max(0, users - 1);
  if (users === 0 && mongo) {
    await mongoose.disconnect();
    await mongo.stop();
    mongo = null;
  }
}
