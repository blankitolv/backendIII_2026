import { authService } from '../services/auth.service.js';
import { toUserDTO } from '../dto/user.dto.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ status: 'success', data: toUserDTO(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  res.json({ status: 'success', data: { token, user: toUserDTO(user) } });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ status: 'success', data: req.user });
});
