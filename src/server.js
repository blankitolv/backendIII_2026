import { app } from './app.js';
import { config } from './config/config.js';
import { connectDb, disconnectDb } from './config/db.js';
import { logger } from './utils/logger.js';

await connectDb(config.mongoUri);

const server = app.listen(config.port, () => {
  logger.info(`ShipNow escuchando en puerto ${config.port}.`, {
    env: config.nodeEnv,
    version: process.env.npm_package_version ?? '1.0.0'
  });
});

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    logger.fatal(`Fallo critico: puerto ${config.port} ocupado.`);
    process.exit(1);
  }
  throw error;
});

async function shutdown(signal) {
  logger.info(`Cierre ordenado por ${signal}.`);
  server.close(async () => {
    await disconnectDb();
    logger.end();
    logger.on('finish', () => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
