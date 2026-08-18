// ─────────────────────────────────────────────
//  Hallow — Rate Limiting
// ─────────────────────────────────────────────
import rateLimit from 'express-rate-limit';

// Strict limit for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      10,
  message:  { error: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// General API limit
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      120,
  message:  { error: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Extension event ingestion — higher limit
export const eventLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      300,
  message:  { error: 'Event rate limit exceeded.' },
});
