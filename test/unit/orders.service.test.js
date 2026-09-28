import { expect } from 'chai';
import sinon from 'sinon';
import { OrdersService } from '../../src/services/orders.service.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.js';
import { ERROR_CODES } from '../../src/constants/errors.js';

function buildRepo(overrides = {}) {
  return {
    paginate: sinon.stub().resolves({ items: [], total: 0, page: 1, limit: 10 }),
    findById: sinon.stub().resolves(null),
    create: sinon.stub().callsFake(async (data) => data),
    updateById: sinon.stub().callsFake(async (id, data) => ({ _id: id, ...data })),
    ...overrides
  };
}

describe('unit - orders.service', () => {
  it('create fuerza estado CREATED y delega al repository', async () => {
    const repo = buildRepo();
    const service = new OrdersService({ orders: repo });
    const data = { user: 'u1', trackingNumber: 'TEST-1' };
    await service.create(data);
    expect(repo.create.calledOnce).to.equal(true);
    expect(repo.create.firstCall.args[0]).to.deep.include({
      ...data,
      status: ORDER_STATUS.CREATED
    });
  });

  it('getById inexistente lanza 404 RESOURCE_NOT_FOUND', async () => {
    const service = new OrdersService({ orders: buildRepo() });
    try {
      await service.getById('no-existe');
      expect.fail('debio lanzar notFound');
    } catch (err) {
      expect(err.code).to.equal(ERROR_CODES.RESOURCE_NOT_FOUND);
      expect(err.statusCode).to.equal(404);
    }
  });

  it('updateStatus permite la transicion valida', async () => {
    const repo = buildRepo({ findById: sinon.stub().resolves({ _id: 'o1', status: ORDER_STATUS.CREATED }) });
    const service = new OrdersService({ orders: repo });
    await service.updateStatus('o1', ORDER_STATUS.ASSIGNED);
    expect(repo.updateById.calledOnceWith('o1', { status: ORDER_STATUS.ASSIGNED })).to.equal(true);
  });

  it('updateStatus invalida lanza 409 INVALID_STATE', async () => {
    const repo = buildRepo({
      findById: sinon.stub().resolves({ _id: 'o1', status: ORDER_STATUS.DELIVERED })
    });
    const service = new OrdersService({ orders: repo });
    try {
      await service.updateStatus('o1', ORDER_STATUS.ASSIGNED);
      expect.fail('debio lanzar invalidState');
    } catch (err) {
      expect(err.code).to.equal(ERROR_CODES.INVALID_STATE);
      expect(err.statusCode).to.equal(409);
      expect(repo.updateById.called).to.equal(false);
    }
  });

  it('updateStatus inexistente lanza 404 sin actualizar', async () => {
    const repo = buildRepo();
    const service = new OrdersService({ orders: repo });
    try {
      await service.updateStatus('no-existe', ORDER_STATUS.ASSIGNED);
      expect.fail('debio lanzar notFound');
    } catch (err) {
      expect(err.code).to.equal(ERROR_CODES.RESOURCE_NOT_FOUND);
      expect(repo.updateById.called).to.equal(false);
    }
  });
});
