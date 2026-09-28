import { expect } from 'chai';
import { ERROR_CODES, ERROR_STATUS } from '../../src/constants/errors.js';
import {
  incompleteValues,
  invalidValues,
  unauthorized,
  forbidden,
  notFound,
  duplicateResource,
  invalidMocksAmount
} from '../../src/utils/errorFactory.js';
import { CustomError } from '../../src/utils/customError.js';

describe('unit - errorFactory', () => {
  it('todo codigo del diccionario tiene status HTTP valido', async () => {
    for (const code of Object.values(ERROR_CODES)) {
      const status = ERROR_STATUS[code];
      expect(status, code).to.be.a('number');
      expect(status).to.be.within(400, 599);
    }
  });

  it('cada helper devuelve CustomError operativo con codigo y status', async () => {
    const cases = [
      [incompleteValues(['a']), ERROR_CODES.INCOMPLETE_VALUES],
      [invalidValues(['b']), ERROR_CODES.INVALID_VALUES],
      [unauthorized(), ERROR_CODES.UNAUTHORIZED],
      [forbidden(), ERROR_CODES.FORBIDDEN],
      [notFound('pedido'), ERROR_CODES.RESOURCE_NOT_FOUND],
      [duplicateResource('email'), ERROR_CODES.DUPLICATE_RESOURCE],
      [invalidMocksAmount(0, 100), ERROR_CODES.INVALID_MOCKS_AMOUNT]
    ];
    for (const [err, code] of cases) {
      expect(err).to.be.instanceOf(CustomError);
      expect(err.code).to.equal(code);
      expect(err.statusCode).to.equal(ERROR_STATUS[code]);
      expect(err.isOperational).to.equal(true);
    }
  });
});
