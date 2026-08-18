// ─────────────────────────────────────────────
//  Hallow — Event Queue
//  Redis-backed queue so no events are lost
//  even if scoring service is busy.
//
//  Flow:
//  Extension → POST /events → push to queue
//  Worker → pop from queue → score → store
// ─────────────────────────────────────────────
import redis from '../config/redis.js';

const QUEUE_KEY     = 'hallow:events:queue';
const PROCESSING_KEY = 'hallow:events:processing';
const MAX_QUEUE_SIZE = 10000;
const BATCH_SIZE     = 20;

// ── Push event batch to queue ────────────────
export async function pushEvents(events) {
  if (!events?.length) return;

  // Check queue size — drop oldest if full
  const size = await redis.lLen(QUEUE_KEY);
  if (size >= MAX_QUEUE_SIZE) {
    await redis.lTrim(QUEUE_KEY, events.length, -1);
  }

  // Push all events as JSON strings
  const serialized = events.map(e => JSON.stringify(e));
  await redis.rPush(QUEUE_KEY, serialized);
}

// ── Pop a batch from queue ───────────────────
export async function popBatch(size = BATCH_SIZE) {
  const items = [];
  for (let i = 0; i < size; i++) {
    const item = await redis.lPop(QUEUE_KEY);
    if (!item) break;
    try { items.push(JSON.parse(item)); } catch {}
  }
  return items;
}

// ── Queue length ─────────────────────────────
export async function queueLength() {
  return redis.lLen(QUEUE_KEY);
}

// ── Clear queue ──────────────────────────────
export async function clearQueue() {
  await redis.del(QUEUE_KEY);
}
