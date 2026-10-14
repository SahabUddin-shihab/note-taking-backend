import 'dotenv/config';

const need = (k) => {
  const v = process.env[k];
  if (!v)
    throw new Error(`Missing env var ${k}`);
  return v;
};

export const env = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: need('MONGO_URI'),
  jwtSecret: need('JWT_SECRET'),
  jwtExpires: process.env.JWT_EXPIRES_IN || '15m',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((s) => s.trim())
};
