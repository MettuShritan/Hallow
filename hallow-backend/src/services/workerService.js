// ─────────────────────────────────────────────
//  Hallow — Worker Service
//  Background process that continuously pops
//  events from Redis queue, scores them, and
//  stores results in PostgreSQL.
//
//  Runs alongside the Express server.
// ─────────────────────────────────────────────
import prisma  from '../config/db.js';
import { popBatch, queueLength } from './eventQueue.js';
import { scoreVector, handleAnomaly } from './scoringService.js';

const POLL_INTERVAL = 1000;  // Poll every 1 second
const IDLE_INTERVAL = 3000;  // Slow down when queue is empty

let isRunning   = false;
let workerTimer = null;

// ── Start the worker ─────────────────────────
export function startWorker() {
  if (isRunning) return;
  isRunning = true;
  console.log('[Hallow Worker] 🚀 Started');
  scheduleNext(POLL_INTERVAL);
}

// ── Stop the worker ──────────────────────────
export function stopWorker() {
  isRunning = false;
  if (workerTimer) clearTimeout(workerTimer);
  console.log('[Hallow Worker] Stopped');
}

// ── Schedule next tick ───────────────────────
function scheduleNext(delay) {
  if (!isRunning) return;
  workerTimer = setTimeout(tick, delay);
}

// ── One tick — process a batch ───────────────
async function tick() {
  try {
    const qLen = await queueLength();

    // Nothing to process — slow down
    if (qLen === 0) {
      scheduleNext(IDLE_INTERVAL);
      return;
    }

    // Pop a batch and process
    const batch = await popBatch(20);
    if (batch.length > 0) {
      await processBatch(batch);
    }

    // Queue still has items — keep going fast
    scheduleNext(qLen > 20 ? 100 : POLL_INTERVAL);

  } catch (err) {
    console.error('[Hallow Worker] Error:', err.message);
    scheduleNext(POLL_INTERVAL);
  }
}

// ── Process a batch of events ────────────────
async function processBatch(events) {
  const results = await Promise.allSettled(
    events.map(event => processEvent(event))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed    = results.filter(r => r.status === 'rejected').length;

  if (failed > 0) {
    console.warn(`[Hallow Worker] Batch: ${succeeded} ok, ${failed} failed`);
  }
}

// ── Process a single event ───────────────────
async function processEvent(event) {
  const { userId, sessionId, url, vector, deviceInfo } = event;

  if (!userId || !vector) return;

  // 1. Score the vector
  const result = await scoreVector({ userId, sessionId, url, vector });

  // 2. Upsert session
  await prisma.session.upsert({
    where:  { sessionId: sessionId || `${userId}-${Date.now()}` },
    update: {
      trustScore: result.trustScore,
      riskLevel:  result.riskLevel,
      anomaly:    result.anomaly,
      lastActive: new Date(),
      url,
    },
    create: {
      userId,
      sessionId: sessionId || `${userId}-${Date.now()}`,
      url,
      trustScore: result.trustScore,
      riskLevel:  result.riskLevel,
      anomaly:    result.anomaly,
    },
  });

  // 3. Store event in DB
  await prisma.event.create({
    data: {
      userId,
      sessionId: sessionId || `${userId}-${Date.now()}`,
      url,
      vector,
      trustScore: result.trustScore,
      riskLevel:  result.riskLevel,
      anomaly:    result.anomaly,
    },
  });

  // 4. Fire alert if anomaly detected
  if (result.anomaly) {
    await handleAnomaly({ userId, result, url, sessionId });
  }

  return result;
}
