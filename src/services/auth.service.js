import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { usersDao } from '../dao/repositories/users.dao.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { duplicateResource, unauthorized } from '../utils/errorFactory.js';

export class AuthService {
  constructor({ users = usersDao } = {}) {
    this.users = users;
  }

  async register({ name, email, password, role }) {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw duplicateResource('email');
    }
    const hashed = await hashPassword(password);
    return this.users.create({ name, email, password: hashed, role });
  }

  async login({ email, password }) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw unauthorized();
    }
    const ok = await comparePassword(password, user.password);
    if (!ok) {
      throw unauthorized();
    }
    const token = jwt.sign(
      { sub: String(user._id), role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    return { token, user };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch {
      throw unauthorized();
    }
  }
}

export const authService = new AuthService();
