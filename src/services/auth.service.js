import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { usersDao } from '../dao/repositories/users.dao.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { CustomError } from '../utils/customError.js';
import { ERROR_CODES } from '../constants/errors.js';

export class AuthService {
  constructor({ users = usersDao } = {}) {
    this.users = users;
  }

  async register({ name, email, password, role }) {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new CustomError(ERROR_CODES.CONFLICT, 'Email already registered');
    }
    const hashed = await hashPassword(password);
    return this.users.create({ name, email, password: hashed, role });
  }

  async login({ email, password }) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new CustomError(ERROR_CODES.UNAUTHORIZED, 'Invalid credentials');
    }
    const ok = await comparePassword(password, user.password);
    if (!ok) {
      throw new CustomError(ERROR_CODES.UNAUTHORIZED, 'Invalid credentials');
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
      throw new CustomError(ERROR_CODES.UNAUTHORIZED, 'Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
