import { ordersService } from '../services/orders.service.js';
import { toOrderDTO } from '../dto/order.dto.js';
import { toListDTO } from '../dto/list.dto.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listOrders = asyncHandler(async (req, res) => {
  const { items, total, page, limit, totalPages } = await ordersService.list(req.query);
  res.json({ status: 'success', ...toListDTO(items.map(toOrderDTO), { page, limit, total, totalPages }) });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await ordersService.getById(req.params.id);
  res.json({ status: 'success', data: toOrderDTO(order) });
});

export const createOrder = asyncHandler(async (req, res) => {
  const order = await ordersService.create(req.body);
  res.status(201).json({ status: 'success', data: toOrderDTO(order) });
});

export const updateOrder = asyncHandler(async (req, res) => {
  const order = await ordersService.update(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: toOrderDTO(order) });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const result = await ordersService.delete(req.params.id);
  res.status(200).json({ status: 'success', data: result });
});
