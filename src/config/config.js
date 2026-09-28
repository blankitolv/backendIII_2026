import dotenv from 'dotenv';

dotenv.config();

const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];

for (const name of REQUIRED) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  internalToken: process.env.INTERNAL_TOKEN ?? null
};
