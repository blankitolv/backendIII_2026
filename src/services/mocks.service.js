import { Faker, es, en } from '@faker-js/faker';
import { usersDao } from '../dao/repositories/users.dao.js';
import { ordersDao } from '../dao/repositories/orders.dao.js';
import { deliveriesDao } from '../dao/repositories/deliveries.dao.js';
import { documentsDao } from '../dao/repositories/documents.dao.js';
import { ROLES } from '../constants/roles.js';
import { ORDER_STATUS } from '../constants/orderStatus.js';
import { DELIVERY_STATUS } from '../constants/deliveryStatus.js';
import { DELIVERY_PRIORITY } from '../constants/priorities.js';
import { DOCUMENT_TYPES } from '../constants/documentTypes.js';
import { config } from '../config/config.js';
import { MOCKS_DEFAULT_PASSWORD, MOCK_RANGES } from '../constants/mockRanges.js';
import { hashPassword } from '../utils/hashPassword.js';
import { invalidValues, invalidMocksAmount } from '../utils/errorFactory.js';
import { logger } from '../utils/logger.js';

// Faker genera solo valores de campo. Nunca un _id de relacion: los ids salen
// de los insertMany previos o de la base existente.
const faker = new Faker({ locale: [es, en] });

const ORDER_STATUSES = Object.values(ORDER_STATUS);
const DELIVERY_STATUSES = Object.values(DELIVERY_STATUS);
const PRIORITIES = Object.values(DELIVERY_PRIORITY);
const DOC_TYPES = Object.values(DOCUMENT_TYPES);

export class MocksService {
  constructor({
    users = usersDao,
    orders = ordersDao,
    deliveries = deliveriesDao,
    documents = documentsDao
  } = {}) {
    this.users = users;
    this.orders = orders;
    this.deliveries = deliveries;
    this.documents = documents;
  }

  assertCount(entity, raw, { allowZero = true } = {}) {
    const range = MOCK_RANGES[entity];
    if (raw === undefined || raw === null || raw === '') {
      return 0;
    }
    const value = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isInteger(value) || Number.isNaN(value) || value < 0) {
      throw invalidValues([entity]);
    }
    const min = allowZero ? range.min : 1;
    if (value < min || value > range.max) {
      throw invalidMocksAmount(min, range.max);
    }
    return value;
  }

  applySeed(seed) {
    if (seed === undefined || seed === null || seed === '') {
      return;
    }
    const value = typeof seed === 'number' ? seed : Number(seed);
    if (!Number.isInteger(value) || value < 0) {
      throw invalidValues(['seed']);
    }
    faker.seed(value);
  }

  pickRole(index) {
    if (index === 0) {
      return ROLES.ADMIN;
    }
    if (index <= 3) {
      return ROLES.COURIER;
    }
    return index % 2 === 0 ? ROLES.CUSTOMER : ROLES.STORE;
  }

  uniqueEmail(taken, index) {
    let attempt = 0;
    let email = faker.internet.email().toLowerCase();
    while (taken.has(email)) {
      attempt += 1;
      const [local, domain] = email.split('@');
      email = `${local}+${index}-${attempt}@${domain}`;
    }
    taken.add(email);
    return email;
  }

  generateUsersMock(count, { startIndex = 0 } = {}) {
    const taken = new Set();
    const users = [];
    for (let i = 0; i < count; i += 1) {
      users.push({
        name: faker.person.fullName(),
        email: this.uniqueEmail(taken, startIndex + i),
        password: MOCKS_DEFAULT_PASSWORD,
        role: this.pickRole(startIndex + i)
      });
    }
    return users;
  }

  generateCouriersMock(count, { startIndex = 0 } = {}) {
    const taken = new Set();
    const couriers = [];
    for (let i = 0; i < count; i += 1) {
      couriers.push({
        name: faker.person.fullName(),
        email: this.uniqueEmail(taken, startIndex + i),
        password: MOCKS_DEFAULT_PASSWORD,
        role: ROLES.COURIER
      });
    }
    return couriers;
  }

  generateOrdersMock(count, userIds = [], { startIndex = 0 } = {}) {
    const ids = userIds?.length ? userIds : Array.from({ length: 5 }, () => faker.database.mongodbObjectId());
    const taken = new Set();
    const orders = [];
    for (let i = 0; i < count; i += 1) {
      let tracking = faker.string.alphanumeric({ length: 10, casing: 'upper' });
      let attempt = 0;
      while (taken.has(tracking)) {
        attempt += 1;
        tracking = `${tracking.slice(0, 8)}${attempt}${startIndex + i}`.slice(0, 12);
      }
      taken.add(tracking);
      orders.push({
        user: faker.helpers.arrayElement(ids),
        trackingNumber: tracking,
        status: faker.helpers.arrayElement(ORDER_STATUSES),
        origin: faker.location.city(),
        destination: faker.location.city(),
        weightKg: faker.number.float({ min: 0.5, max: 50, fractionDigits: 2 }),
        deliveryAddress: faker.location.streetAddress(),
        priority: faker.helpers.arrayElement(PRIORITIES)
      });
    }
    return orders;
  }

  getMockingUsers(count = 50) {
    const validCount = Number.isInteger(count) && count > 0 ? Math.min(count, 500) : 50;
    return this.generateUsersMock(validCount);
  }

  getMockingOrders(count = 50) {
    const validCount = Number.isInteger(count) && count > 0 ? Math.min(count, 500) : 50;
    return this.generateOrdersMock(validCount);
  }

  generateDeliveriesMock(count, orderIds, courierIds) {
    const deliveries = [];
    for (let i = 0; i < count; i += 1) {
      const status = faker.helpers.arrayElement(DELIVERY_STATUSES);
      deliveries.push({
        order: faker.helpers.arrayElement(orderIds),
        courier: faker.helpers.arrayElement(courierIds),
        status,
        deliveredAt: status === DELIVERY_STATUS.DELIVERED ? faker.date.recent() : null
      });
    }
    return deliveries;
  }

  generateDocumentsMock(count, orderIds, uploaderIds, { startIndex = 0 } = {}) {
    const documents = [];
    for (let i = 0; i < count; i += 1) {
      const storedName = `mock-${startIndex + i}-${faker.string.alphanumeric({ length: 6 })}.pdf`;
      documents.push({
        originalName: `proof-${startIndex + i}.pdf`,
        storedName,
        mimeType: 'application/pdf',
        size: faker.number.int({ min: 1000, max: 5000000 }),
        path: `uploads/mocks/${storedName}`,
        uploadedBy: faker.helpers.arrayElement(uploaderIds),
        parentModel: 'Order',
        parentId: faker.helpers.arrayElement(orderIds),
        type: faker.helpers.arrayElement(DOC_TYPES)
      });
    }
    return documents;
  }

  // Insercion en orden estricto, una sola llamada por entidad, sin transacciones
  // (memory server standalone no las soporta). Todas las claves mock comparten
  // MOCKS_DEFAULT_PASSWORD, asi que un solo hash alcanza para todas.
  async seedData({ users = [], couriers = [], orders = [], deliveries = [], documents = [] } = {}) {
    if (!users.length && !couriers.length && !orders.length && !deliveries.length && !documents.length) {
      throw invalidMocksAmount(0, config.mocks.maxAmount);
    }
    const password = await hashPassword(MOCKS_DEFAULT_PASSWORD);
    const withHash = (items) => items.map((item) => ({ ...item, password }));
    const insertedUsers = users.length ? await this.users.insertMany(withHash(users)) : [];
    const insertedCouriers = couriers.length ? await this.users.insertMany(withHash(couriers)) : [];
    const insertedOrders = orders.length ? await this.orders.insertMany(orders) : [];
    const insertedDeliveries = deliveries.length ? await this.deliveries.insertMany(deliveries) : [];
    const insertedDocuments = documents.length ? await this.documents.insertMany(documents) : [];
    logger.debug(
      `Mocks sembrados: ${insertedUsers.length} usuarios, ${insertedCouriers.length} repartidores, ` +
        `${insertedOrders.length} pedidos, ${insertedDeliveries.length} entregas, ` +
        `${insertedDocuments.length} documentos.`
    );
    return {
      users: insertedUsers,
      couriers: insertedCouriers,
      orders: insertedOrders,
      deliveries: insertedDeliveries,
      documents: insertedDocuments
    };
  }

  async existingIds(dao, limit) {
    if (limit <= 0) {
      return [];
    }
    const { items } = await dao.paginate({}, { page: 1, limit });
    return items.map((item) => item._id);
  }

  async generateData({ users = 0, couriers = 0, orders = 0, deliveries = 0, documents = 0, seed } = {}) {
    const counts = {
      users: this.assertCount('users', users),
      couriers: this.assertCount('couriers', couriers),
      orders: this.assertCount('orders', orders),
      deliveries: this.assertCount('deliveries', deliveries),
      documents: this.assertCount('documents', documents)
    };
    this.applySeed(seed);
    if (Object.values(counts).every((value) => value === 0)) {
      throw invalidMocksAmount(0, config.mocks.maxAmount);
    }
    if (counts.orders > 0 && counts.users === 0) {
      const existing = await this.existingIds(this.users, 1);
      if (!existing.length) {
        counts.users = 1;
      }
    }
    if (counts.deliveries > 0 && counts.couriers === 0) {
      const existing = await this.existingIds(this.users, 1);
      if (!existing.length) {
        counts.couriers = 1;
      }
    }
    if ((counts.deliveries > 0 || counts.documents > 0) && counts.orders === 0) {
      const existing = await this.existingIds(this.orders, 1);
      if (!existing.length) {
        counts.orders = 1;
      }
    }
    const usersMock = this.generateUsersMock(counts.users);
    const couriersMock = this.generateCouriersMock(counts.couriers, { startIndex: counts.users });
    const seededUsers = await this.seedData({ users: usersMock, couriers: couriersMock });
    const userPool = [
      ...seededUsers.users.map((user) => user._id),
      ...(await this.existingIds(this.users, counts.orders + counts.documents))
    ];
    const ordersMock =
      counts.orders > 0 ? this.generateOrdersMock(counts.orders, userPool) : [];
    const seededOrders = ordersMock.length ? await this.orders.insertMany(ordersMock) : [];
    const courierPool = [
      ...seededUsers.couriers.map((user) => user._id),
      ...seededUsers.users.filter((user) => user.role === ROLES.COURIER).map((user) => user._id)
    ];
    const orderPool = [
      ...seededOrders.map((order) => order._id),
      ...(await this.existingIds(this.orders, counts.deliveries + counts.documents))
    ];
    const deliveriesMock =
      counts.deliveries > 0
        ? this.generateDeliveriesMock(counts.deliveries, orderPool, courierPool)
        : [];
    const seededDeliveries = deliveriesMock.length
      ? await this.deliveries.insertMany(deliveriesMock)
      : [];
    const documentsMock =
      counts.documents > 0 ? this.generateDocumentsMock(counts.documents, orderPool, userPool) : [];
    const seededDocuments = documentsMock.length
      ? await this.documents.insertMany(documentsMock)
      : [];
    logger.debug(
      `generateData sembrado: ${seededUsers.users.length} usuarios, ` +
        `${seededUsers.couriers.length} repartidores, ${seededOrders.length} pedidos, ` +
        `${seededDeliveries.length} entregas, ${seededDocuments.length} documentos.`
    );
    return {
      users: seededUsers.users.length,
      couriers: seededUsers.couriers.length,
      orders: seededOrders.length,
      deliveries: seededDeliveries.length,
      documents: seededDocuments.length
    };
  }

  async seedSingleUsers(count, seed) {
    const total = this.assertCount('users', count, { allowZero: false });
    this.applySeed(seed);
    const seeded = await this.seedData({ users: this.generateUsersMock(total) });
    return { users: seeded.users.length };
  }

  async seedSingleOrders(count, seed) {
    const total = this.assertCount('orders', count, { allowZero: false });
    this.applySeed(seed);
    let userPool = await this.existingIds(this.users, total);
    let extra = { users: 0 };
    if (!userPool.length) {
      const created = await this.seedData({ users: this.generateUsersMock(1) });
      extra = { users: created.users.length };
      userPool = created.users.map((user) => user._id);
    }
    const seeded = await this.orders.insertMany(this.generateOrdersMock(total, userPool));
    return { users: extra.users, orders: seeded.length };
  }

  async seedSingleDeliveries(count, seed) {
    const total = this.assertCount('deliveries', count, { allowZero: false });
    this.applySeed(seed);
    let orderPool = await this.existingIds(this.orders, total);
    let courierPool = await this.existingIds(this.users, total);
    let extra = { users: 0, couriers: 0, orders: 0 };
    if (!orderPool.length || !courierPool.length) {
      const created = await this.generateData({ users: 1, couriers: 1, orders: 1 });
      extra = { users: created.users, couriers: created.couriers, orders: created.orders };
      orderPool = await this.existingIds(this.orders, total);
      courierPool = await this.existingIds(this.users, total);
    }
    const seeded = await this.deliveries.insertMany(
      this.generateDeliveriesMock(total, orderPool, courierPool)
    );
    return { ...extra, deliveries: seeded.length };
  }

  async seedFull(count, seed) {
    const value = typeof count === 'number' ? count : Number(count);
    if (!Number.isInteger(value) || Number.isNaN(value) || value < 1) {
      throw invalidValues(['cantidad']);
    }
    if (value > config.mocks.maxAmount) {
      throw invalidMocksAmount(1, config.mocks.maxAmount);
    }
    const couriers = Math.max(1, Math.round(value / 3));
    return this.generateData({ users: value, couriers, orders: value, deliveries: value, documents: value, seed });
  }

  async clearAll() {
    const [users, orders, deliveries, documents] = await Promise.all([
      this.users.deleteMany({}),
      this.orders.deleteMany({}),
      this.deliveries.deleteMany({}),
      this.documents.deleteMany({})
    ]);
    logger.debug(
      `Mocks limpiados: ${users.deletedCount} usuarios, ${orders.deletedCount} pedidos, ` +
        `${deliveries.deletedCount} entregas, ${documents.deletedCount} documentos.`
    );
    return {
      users: users.deletedCount ?? 0,
      orders: orders.deletedCount ?? 0,
      deliveries: deliveries.deletedCount ?? 0,
      documents: documents.deletedCount ?? 0
    };
  }
}

export const mocksService = new MocksService();
