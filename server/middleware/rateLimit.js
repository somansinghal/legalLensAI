export function createRateLimiter({ windowMs, max }) {
  if (process.env.NODE_ENV === 'test' || process.env.AI_TEST_MODE === 'true') {
    return (req, res, next) => next();
  }
  const buckets = new Map();

  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const current = buckets.get(key);
    const bucket = current && now - current.startedAt < windowMs
      ? current
      : { startedAt: now, count: 0 };

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.', requestId: req.requestId }
      });
    }
    return next();
  };
}
