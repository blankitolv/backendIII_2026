import { deliveriesService } from '../services/deliveries.service.js';
import { toDeliveryDTO } from '../dto/delivery.dto.js';
import { toListDTO } from '../dto/list.dto.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listDeliveries = asyncHandler(async (req, res) => {
  const { items, total, page, limit, totalPages } = await deliveriesService.list(req.query);
  res.json({ status: 'success', ...toListDTO(items.map(toDeliveryDTO), { page, limit, total, totalPages }) });
});

export const getDelivery = asyncHandler(async (req, res) => {
  const delivery = await deliveriesService.getById(req.params.id);
  res.json({ status: 'success', data: toDeliveryDTO(delivery) });
});

export const createDelivery = asyncHandler(async (req, res) => {
  const delivery = await deliveriesService.create(req.body);
  res.status(201).json({ status: 'success', data: toDeliveryDTO(delivery) });
});
