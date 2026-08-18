// ─────────────────────────────────────────────
//  Hallow — Auth Middleware
//  Verifies JWT on every protected route
// ─────────────────────────────────────────────
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import redis from '../config/redis.js';

export const requireAuth = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const auth  = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = auth.split(' ')[1];

    // 2. Check if token is blacklisted (logged out)
    const blacklisted = await redis.get(`blacklist:${token}`);
    if (blacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // 3. Verify JWT
    const payload = jwt.verify(token, config.jwt.secret);

    // 4. Attach user to request
    req.user  = payload;
    req.token = token;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Generate access token
export const signToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// Blacklist token on logout
export const revokeToken = async (token) => {
  // Store in Redis until it would have expired
  const decoded = jwt.decode(token);
  const ttl     = decoded?.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redis.setEx(`blacklist:${token}`, ttl, '1');
  }
};
