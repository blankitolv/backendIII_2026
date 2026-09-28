import { ordersService } from '../services/orders.service.js';
import { toOrderDTO, toListDTO } from '../dto/order.dto.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listOrders = asyncHandler(async (req, res) => {
  const { items, total, page, limit } = await ordersService.list(req.query);
  const mapped = toListDTO(items.map(toOrderDTO), { page, limit, total });
  res.json({ status: 'success', data: mapped });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await ordersService.getById(req.params.id);
  res.json({ status: 'success', data: toOrderDTO(order) });
});

export const createOrder = asyncHandler(async (req, res) => {
  const order = await ordersService.create(req.body);
  res.status(201).json({ status: 'success', data: toOrderDTO(order) });
});
