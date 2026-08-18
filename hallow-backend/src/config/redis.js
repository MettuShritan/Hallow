// ─────────────────────────────────────────────
//  Hallow — Redis Client
//  Used for: rate limiting, session blacklist,
//  event queue, baseline sync cache
// ─────────────────────────────────────────────
import { createClient } from 'redis';
import { config } from './index.js';

const redis = createClient({ url: config.redis.url });

redis.on('error', err => console.error('[Hallow Redis]', err.message));
redis.on('connect', () => console.log('[Hallow Redis] Connected'));

await redis.connect();

export default redis;
