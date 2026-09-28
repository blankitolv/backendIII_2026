import { expect } from 'chai';
import sinon from 'sinon';
import { validate } from '../../src/middlewares/validate.middleware.js';
import { registerValidator, loginValidator } from '../../src/validators/auth.validator.js';
import { orderValidator, orderIdValidator } from '../../src/validators/orders.validator.js';
import { deliveryValidator, deliveryIdValidator } from '../../src/validators/deliveries.validator.js';
import { ERROR_CODES } from '../../src/constants/errors.js';

function run(schema, req) {
  const next = sinon.spy();
  try {
    validate(schema)({ body: {}, query: {}, params: {}, ...req }, {}, next);
    return { thrown: null, next };
  } catch (err) {
    return { thrown: err, next };
  }
}

const MINIMAL = {
  register: { body: { name: 'Test', email: 't@example.com', password: 'x', role: 'customer' } },
  login: { body: { email: 't@example.com', password: 'x' } },
  order: {
    body: {
      user: 'u1',
      trackingNumber: 'TEST-1',
      origin: 'A',
      destination: 'B',
      weightKg: 2,
      deliveryAddress: 'Calle 1'
    }
  },
  delivery: { body: { order: 'o1', courier: 'c1' } }
};

describe('unit - validators', () => {
  it('register rechaza campos faltantes nombrándolos', async () => {
    const { thrown, next } = run(registerValidator, { body: {} });
    expect(next.called).to.equal(false);
    expect(thrown.code).to.equal(ERROR_CODES.INCOMPLETE_VALUES);
    expect(thrown.message).to.include('body.email');
    expect(thrown.message).to.include('body.password');
  });

  it('register rechaza rol fuera de rango y acepta el minimo valido', async () => {
    const bad = run(registerValidator, {
      body: { ...MINIMAL.register.body, role: 'superadmin' }
    });
    expect(bad.thrown.code).to.equal(ERROR_CODES.INVALID_VALUES);
    expect(bad.thrown.message).to.include('body.role');
    const ok = run(registerValidator, MINIMAL.register);
    expect(ok.thrown).to.equal(null);
    expect(ok.next.calledOnce).to.equal(true);
  });

  it('login exige email y password', async () => {
    const { thrown } = run(loginValidator, { body: { email: 't@example.com' } });
    expect(thrown.code).to.equal(ERROR_CODES.INCOMPLETE_VALUES);
    expect(run(loginValidator, MINIMAL.login).thrown).to.equal(null);
  });

  it('order rechaza tipo incorrecto y acepta el minimo valido', async () => {
    const bad = run(orderValidator, {
      body: { ...MINIMAL.order.body, weightKg: 'pesado' }
    });
    expect(bad.thrown.code).to.equal(ERROR_CODES.INVALID_VALUES);
    expect(bad.thrown.message).to.include('body.weightKg');
    expect(run(orderValidator, MINIMAL.order).thrown).to.equal(null);
  });

  it('order exige todos los campos del envio', async () => {
    const { thrown } = run(orderValidator, { body: { user: 'u1' } });
    expect(thrown.code).to.equal(ERROR_CODES.INCOMPLETE_VALUES);
    expect(thrown.message).to.include('body.trackingNumber');
  });

  it('delivery exige order y courier', async () => {
    const { thrown } = run(deliveryValidator, { body: {} });
    expect(thrown.code).to.equal(ERROR_CODES.INCOMPLETE_VALUES);
    expect(run(deliveryValidator, MINIMAL.delivery).thrown).to.equal(null);
  });

  it('los validadores de id exigen params.id', async () => {
    for (const schema of [orderIdValidator, deliveryIdValidator]) {
      const { thrown } = run(schema, { params: {} });
      expect(thrown.code).to.equal(ERROR_CODES.INCOMPLETE_VALUES);
      expect(thrown.message).to.include('params.id');
      expect(run(schema, { params: { id: 'abc' } }).thrown).to.equal(null);
    }
  });
});
