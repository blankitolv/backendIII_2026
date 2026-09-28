import { expect } from 'chai';
import { logLevels } from '../../src/config/logLevels.js';
import { formatRedact, SENSITIVE_LOG_KEYS } from '../../src/utils/loggerRedact.js';
import { logger } from '../../src/utils/logger.js';

describe('unit - logger', () => {
  it('fatal es el mas severo y debug el menos', async () => {
    expect(logLevels.fatal).to.be.below(logLevels.error);
    expect(logLevels.error).to.be.below(logLevels.warn);
    expect(logLevels.warn).to.be.below(logLevels.info);
    expect(logLevels.info).to.be.below(logLevels.http);
    expect(logLevels.http).to.be.below(logLevels.debug);
  });

  it('enmascara claves sensibles incluso anidadas', async () => {
    const info = {
      level: 'info',
      message: 'login',
      password: 'secreto',
      token: 'abc',
      nested: { authorization: 'Bearer x', keep: 'si' },
      list: [{ secret: 's' }]
    };
    const redacted = formatRedact().transform(info);
    expect(redacted.password).to.equal('[REDACTED]');
    expect(redacted.token).to.equal('[REDACTED]');
    expect(redacted.nested.authorization).to.equal('[REDACTED]');
    expect(redacted.nested.keep).to.equal('si');
    expect(redacted.list[0].secret).to.equal('[REDACTED]');
    expect(SENSITIVE_LOG_KEYS).to.include('password');
  });

  it('expone alias warning y metodos de nivel sin base de datos', async () => {
    expect(logger.warning).to.be.a('function');
    for (const level of ['debug', 'http', 'info', 'warn', 'error']) {
      expect(logger[level]).to.be.a('function');
    }
  });
});
