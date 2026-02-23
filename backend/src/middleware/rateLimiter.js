import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

export const authLimiter = rateLimit({
  windowMs: 900000, // 15 minutes
  max: 5,
  message: { success: false, error: 'Too many authentication attempts' }
});

export const aiLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: parseInt(process.env.AI_RATE_LIMIT_MAX) || 50,
  message: { success: false, error: 'Too many AI requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

export default apiLimiter;