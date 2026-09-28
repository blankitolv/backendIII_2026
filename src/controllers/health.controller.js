import { asyncHandler } from '../utils/asyncHandler.js';

export const health = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: { status: 'up', uptime: process.uptime(), version: '1.0.0' }
  });
});
