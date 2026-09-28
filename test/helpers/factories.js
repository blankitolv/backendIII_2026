import { faker } from '@faker-js/faker';
import { ROLES } from '../../src/constants/roles.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.js';
import { DELIVERY_STATUS } from '../../src/constants/deliveryStatus.js';
import { DELIVERY_PRIORITY } from '../../src/constants/priorities.js';
import { DOCUMENT_TYPES } from '../../src/constants/documentTypes.js';

// Builders con defaults validos segun los modelos. Los tests los usan en vez
// de los endpoints de mocks o de un seeding global. Ningun valor es real:
// emails y documentos ficticios y marcados como prueba.
export function buildUser(overrides = {}) {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: 'Test-only-123',
    role: ROLES.CUSTOMER,
    ...overrides
  };
}

export function buildOrder(userId, overrides = {}) {
  return {
    user: String(userId),
    trackingNumber: `TEST-${faker.string.alphanumeric(10).toUpperCase()}`,
    status: ORDER_STATUS.CREATED,
    origin: faker.location.city(),
    destination: faker.location.city(),
    weightKg: faker.number.float({ min: 0.1, max: 50, fractionDigits: 2 }),
    deliveryAddress: faker.location.streetAddress(),
    priority: DELIVERY_PRIORITY.NORMAL,
    ...overrides
  };
}

export function buildDelivery(orderId, courierId, overrides = {}) {
  return {
    order: String(orderId),
    courier: String(courierId),
    status: DELIVERY_STATUS.ASSIGNED,
    ...overrides
  };
}

export function buildDocument(uploadedById, parentId, overrides = {}) {
  return {
    originalName: 'test-proof.pdf',
    storedName: `test-${faker.string.alphanumeric(8)}.pdf`,
    mimeType: 'application/pdf',
    size: 1024,
    path: 'uploads/test-proof.pdf',
    uploadedBy: String(uploadedById),
    parentModel: 'Delivery',
    parentId: String(parentId),
    type: DOCUMENT_TYPES.DELIVERY_PROOF,
    ...overrides
  };
}
