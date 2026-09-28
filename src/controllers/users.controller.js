import { usersService } from '../services/users.service.js';
import { toUserDTO } from '../dto/user.dto.js';
import { toListDTO } from '../dto/list.dto.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { items, total, page, limit, totalPages } = await usersService.list(req.query);
  res.json({ status: 'success', ...toListDTO(items.map(toUserDTO), { page, limit, total, totalPages }) });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await usersService.getById(req.params.id);
  res.json({ status: 'success', data: toUserDTO(user) });
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await usersService.create(req.body);
  res.status(201).json({ status: 'success', data: toUserDTO(user) });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await usersService.update(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: toUserDTO(user) });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const result = await usersService.delete(req.params.id);
  res.status(200).json({ status: 'success', data: result });
});
