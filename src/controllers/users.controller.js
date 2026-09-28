import { usersService } from '../services/users.service.js';
import { toUserDTO } from '../dto/user.dto.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await usersService.list(req.query);
  res.json({ status: 'success', data: { items: items.map(toUserDTO), meta: { page, limit, total } } });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await usersService.getById(req.params.id);
  res.json({ status: 'success', data: toUserDTO(user) });
});
