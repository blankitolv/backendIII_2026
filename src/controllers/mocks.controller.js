import { mocksService } from '../services/mocks.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const generateData = asyncHandler(async (req, res) => {
  const { users, couriers, orders, deliveries, documents, seed } = req.body ?? {};
  const data = await mocksService.generateData({ users, couriers, orders, deliveries, documents, seed });
  res.status(200).json({ status: 'success', data });
});

export const generateUsers = asyncHandler(async (req, res) => {
  const data = await mocksService.seedSingleUsers(req.query.cantidad, req.query.seed);
  res.status(200).json({ status: 'success', data });
});

export const generateOrders = asyncHandler(async (req, res) => {
  const data = await mocksService.seedSingleOrders(req.query.cantidad, req.query.seed);
  res.status(200).json({ status: 'success', data });
});

export const generateDeliveries = asyncHandler(async (req, res) => {
  const data = await mocksService.seedSingleDeliveries(req.query.cantidad, req.query.seed);
  res.status(200).json({ status: 'success', data });
});

export const generateFull = asyncHandler(async (req, res) => {
  const data = await mocksService.seedFull(req.query.cantidad, req.query.seed);
  res.status(200).json({ status: 'success', data });
});

export const clearMocks = asyncHandler(async (req, res) => {
  const data = await mocksService.clearAll();
  res.status(200).json({ status: 'success', data });
});
