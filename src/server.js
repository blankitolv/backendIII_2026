import { app } from './app.js';
import { config } from './config/config.js';
import { connectDb } from './config/db.js';
import { logger } from './utils/logger.js';

await connectDb(config.mongoUri);

app.listen(config.port, () => {
  logger.info(`ShipNow listening on ${config.port}`, { env: config.nodeEnv });
});
