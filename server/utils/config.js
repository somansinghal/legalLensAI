import 'dotenv/config';

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = Object.freeze({
  port: toPositiveInt(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  bodyLimit: process.env.MAX_DOCUMENT_BYTES || '500kb',
  rateLimitWindowMs: toPositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: toPositiveInt(process.env.RATE_LIMIT_MAX, 20)
});
