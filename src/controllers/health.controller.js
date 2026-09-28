import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config/config.js';
import { checkDatabaseReady } from '../config/db.js';
import { notReady } from '../utils/errorFactory.js';

export const health = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: {
      status: 'up',
      uptime: process.uptime(),
      version: '1.0.0',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString()
    }
  });
});

export const ready = asyncHandler(async (req, res) => {
  const isReady = await checkDatabaseReady();
  if (!isReady) {
    throw notReady();
  }
  res.json({ status: 'success', data: { status: 'ready' } });
});