import { expect } from 'chai';
import { toUserDTO } from '../../src/dto/user.dto.js';

describe('unit - user.dto', () => {
  it('excluye password, passwordHash e _id crudo aunque vengan en la entrada', async () => {
    const dto = toUserDTO({
      _id: '64f1a2b3c4d5e6f70819293a',
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer',
      password: 'secreto',
      passwordHash: 'hash',
      createdAt: new Date('2026-09-28T10:00:00.000Z'),
      updatedAt: new Date('2026-09-28T10:00:00.000Z')
    });
    expect(dto).to.not.have.property('password');
    expect(dto).to.not.have.property('passwordHash');
    expect(dto).to.not.have.property('_id');
    expect(dto).to.deep.equal({
      id: '64f1a2b3c4d5e6f70819293a',
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer',
      createdAt: '2026-09-28T10:00:00.000Z',
      updatedAt: '2026-09-28T10:00:00.000Z'
    });
  });

  it('entrada nula devuelve nulo', async () => {
    expect(toUserDTO(null)).to.equal(null);
  });
});
