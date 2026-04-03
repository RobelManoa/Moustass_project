import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  windowMs: 15 * 60 * 1000,
});