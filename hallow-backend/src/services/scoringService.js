// ─────────────────────────────────────────────
//  Hallow — Scoring Service
//  Server-side behavioral anomaly detection.
//  Scores feature vectors against user baseline.
//  Triggers alerts when anomaly detected.
// ─────────────────────────────────────────────
import prisma  from '../config/db.js';
import redis   from '../config/redis.js';
import { sendAnomalyEmail, sendAnomalySMS } from './notificationService.js';

const MIN_SAMPLES    = 50;   // Samples needed before training
const RETRAIN_EVERY  = 100;  // Retrain every N new samples
const CACHE_TTL      = 300;  // Cache baseline for 5 minutes

// ── Main scoring function ────────────────────
// Takes a feature vector, returns risk assessment
export async function scoreVector({ userId, sessionId, url, vector }) {
  if (!vector || vector.length !== 12) {
    return { trustScore: 100, anomaly: false, riskLevel: 'unknown', message: 'Invalid vector' };
  }

  // 1. Get baseline (cached)
  const baseline = await getBaseline(userId);

  // 2. Score against baseline
  const result = computeScore(vector, baseline);

  // 3. Update baseline with new sample (async, don't await)
  updateBaseline(userId, vector, baseline).catch(console.error);

  return result;
}

// ── Compute anomaly score ────────────────────
function computeScore(vector, baseline) {
  // Not enough data yet
  if (!baseline?.trained || !baseline?.normMean || !baseline?.normStd) {
    const remaining = Math.max(0, MIN_SAMPLES - (baseline?.sampleCount || 0));
    return {
      trustScore: 100,
      anomaly:    false,
      riskLevel:  'learning',
      error:      0,
      message:    remaining > 0
        ? `Learning your behavior — ${remaining} more samples needed`
        : 'Finalizing baseline...',
    };
  }

  const { normMean, normStd, threshold } = baseline;

  // Normalize vector (z-score)
  const normalized = vector.map((v, i) =>
    (v - normMean[i]) / (normStd[i] || 1)
  );

  // Mean squared error
  const mse = normalized.reduce((sum, v) => sum + v * v, 0) / normalized.length;

  // Convert to trust score
  const ratio      = mse / (threshold || 0.05);
  const trustScore = Math.max(0, Math.min(100, Math.round((1 - Math.min(ratio / 3, 1)) * 100)));
  const riskLevel  = ratio < 0.6 ? 'low' : ratio < 1.0 ? 'medium' : ratio < 1.8 ? 'high' : 'critical';
  const anomaly    = riskLevel === 'high' || riskLevel === 'critical';

  return {
    trustScore,
    anomaly,
    riskLevel,
    error:     mse,
    threshold: threshold || 0.05,
  };
}

// ── Update user baseline ─────────────────────
async function updateBaseline(userId, vector, existing) {
  try {
    const current     = existing || {};
    const vectors     = [...(current.vectors || []), vector].slice(-500);
    const sampleCount = (current.sampleCount || 0) + 1;

    let updates = { vectors, sampleCount };

    // Retrain at intervals
    if (
      (!current.trained && vectors.length >= MIN_SAMPLES) ||
      (current.trained  && sampleCount % RETRAIN_EVERY === 0)
    ) {
      const stats     = computeNormStats(vectors);
      const threshold = calibrateThreshold(vectors, stats);
      updates = {
        ...updates,
        normMean:  stats.mean,
        normStd:   stats.std,
        threshold,
        trained:   true,
      };
      console.log(`[Hallow] Retrained baseline for ${userId} — threshold: ${threshold.toFixed(5)}`);
    }

    await prisma.baseline.upsert({
      where:  { userId },
      update: updates,
      create: { userId, ...updates },
    });

    // Invalidate cache
    await redis.del(`baseline:${userId}`);

  } catch (err) {
    console.error('[Hallow] Baseline update error:', err.message);
  }
}

// ── Get baseline (with Redis cache) ──────────
async function getBaseline(userId) {
  const cacheKey = `baseline:${userId}`;

  // Try cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  // Fetch from DB
  const baseline = await prisma.baseline.findUnique({ where: { userId } });

  // Cache it
  if (baseline) {
    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(baseline));
  }

  return baseline;
}

// ── Handle confirmed anomaly ─────────────────
export async function handleAnomaly({ userId, result, url, sessionId }) {
  try {
    // Get user contact info
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { name: true, email: true, contactEmail: true, contactPhone: true },
    });

    if (!user) return;

    // Check rate limit — don't spam alerts (max 1 per 5 min per user)
    const rateLimitKey = `alert:ratelimit:${userId}`;
    const recentAlert  = await redis.get(rateLimitKey);
    if (recentAlert) {
      console.log(`[Hallow] Alert rate limited for ${userId}`);
      return;
    }

    // Set rate limit
    await redis.setEx(rateLimitKey, 300, '1');

    // Create alert in DB
    await prisma.alert.create({
      data: {
        userId,
        type:       'anomaly',
        title:      'Unusual behavior detected',
        detail:     `Trust score dropped to ${result.trustScore.toFixed(1)}% on ${url || 'your browser'}`,
        riskLevel:  result.riskLevel,
        trustScore: result.trustScore,
        url,
      },
    });

    // Send notifications
    const alertTo = user.contactEmail || user.email;
    const time    = new Date().toLocaleString();

    const notifications = [
      sendAnomalyEmail({
        to:         alertTo,
        userName:   user.name,
        trustScore: result.trustScore,
        url,
        time,
      }),
    ];

    if (user.contactPhone) {
      notifications.push(
        sendAnomalySMS({ to: user.contactPhone, trustScore: result.trustScore, url })
      );
    }

    await Promise.allSettled(notifications);

    console.log(`[Hallow] 🚨 Anomaly alert sent for ${userId} — score: ${result.trustScore}%`);

  } catch (err) {
    console.error('[Hallow] Handle anomaly error:', err.message);
  }
}

// ── Math helpers ─────────────────────────────
function computeNormStats(vectors) {
  const n   = vectors.length;
  const dim = vectors[0].length;

  const mean = new Array(dim).fill(0);
  const std  = new Array(dim).fill(0);

  vectors.forEach(v => v.forEach((val, i) => { mean[i] += val / n; }));
  vectors.forEach(v => v.forEach((val, i) => { std[i]  += Math.pow(val - mean[i], 2) / n; }));
  std.forEach((v, i) => { std[i] = Math.sqrt(v) || 1; });

  return { mean, std };
}

function calibrateThreshold(vectors, stats) {
  const errors = vectors.map(v => {
    const norm = v.map((val, i) => (val - stats.mean[i]) / stats.std[i]);
    return norm.reduce((s, val) => s + val * val, 0) / norm.length;
  });
  errors.sort((a, b) => a - b);
  return errors[Math.floor(errors.length * 0.95)] || 0.05;
}
