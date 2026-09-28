import { mocksService } from '../services/mocks.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const generateMocks = asyncHandler(async (req, res) => {
  const { users = [], orders = [] } = req.body ?? {};
  const createdUsers = users.length ? await mocksService.generateUsers(users) : [];
  const createdOrders = orders.length ? await mocksService.generateOrders(orders) : [];
  res.status(201).json({
    status: 'success',
    data: { users: createdUsers.length, orders: createdOrders.length }
  });
});
