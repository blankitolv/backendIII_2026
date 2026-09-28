import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

mongoose.connection.on('disconnected', () => {
  logger.warn('Conexion a MongoDB perdida, reintentando.');
});

mongoose.connection.on('reconnected', () => {
  logger.info('Conexion a MongoDB restablecida.');
});

export async function connectDb(uri, { retries = 3 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(uri);
      logger.info('Conexion a MongoDB establecida con exito.');
      return mongoose.connection;
    } catch (error) {
      if (attempt < retries) {
        logger.warn(`Reintento de conexion a MongoDB ${attempt}/${retries}: ${error.message}`);
      } else {
        logger.fatal(`Fallo critico al conectar con la base de datos: ${error.message}`);
        process.exit(1);
      }
    }
  }
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
  logger.info('Conexion a MongoDB cerrada de forma ordenada.');
}
