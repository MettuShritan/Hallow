// ─────────────────────────────────────────────
//  Hallow — Score Route
//  POST /score
//  Receives feature vector from extension,
//  scores it, stores result, fires alerts
// ─────────────────────────────────────────────
import { Router } from 'express';
import { z }       from 'zod';
import prisma      from '../config/db.js';
import { requireAuth }  from '../middleware/auth.js';
import { eventLimiter } from '../middleware/rateLimit.js';
import { sendAnomalyEmail, sendAnomalySMS } from '../services/notificationService.js';
import { config } from '../config/index.js';

const router = Router();

const scoreSchema = z.object({
  sessionId:  z.string(),
  url:        z.string().optional(),
  features: z.object({
    vector: z.array(z.number()).length(12),
  }),
});

// ── POST /score ──────────────────────────────
router.post('/', requireAuth, eventLimiter, async (req, res) => {
  try {
    const { sessionId, url, features } = scoreSchema.parse(req.body);
    const userId = req.user.userId;
    const vector = features.vector;

    // 1. Get or create session
    let session = await prisma.session.upsert({
      where:  { sessionId },
      update: { lastActive: new Date(), url },
      create: { userId, sessionId, url },
    });

    // 2. Get user's baseline
    const baseline = await prisma.baseline.findUnique({ where: { userId } });

    // 3. Score the vector
    const result = scoreVector(vector, baseline);

    // 4. Update session trust score
    await prisma.session.update({
      where: { sessionId },
      data: {
        trustScore: result.trustScore,
        riskLevel:  result.riskLevel,
        anomaly:    result.anomaly,
      },
    });

    // 5. Store event
    await prisma.event.create({
      data: {
        userId,
        sessionId,
        url,
        vector:     vector,
        trustScore: result.trustScore,
        riskLevel:  result.riskLevel,
        anomaly:    result.anomaly,
      },
    });

    // 6. Update baseline with new sample
    await updateBaseline(userId, vector, baseline);

    // 7. Fire alert if anomaly detected
    if (result.anomaly) {
      await handleAnomaly({ userId, result, url, sessionId });
    }

    res.json(result);

  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid feature vector', details: err.errors });
    }
    console.error('[Score]', err);
    res.status(500).json({ error: 'Scoring failed' });
  }
});

// ── Score vector against baseline ────────────
function scoreVector(vector, baseline) {
  // Not trained yet — return neutral
  if (!baseline?.trained || !baseline?.normMean) {
    const remaining = Math.max(0, 50 - (baseline?.sampleCount || 0));
    return {
      trustScore: 100,
      anomaly:    false,
      riskLevel:  'unknown',
      error:      0,
      message:    remaining > 0
        ? `Collecting baseline — ${remaining} more samples needed`
        : 'Training in progress',
    };
  }

  const mean      = baseline.normMean;
  const std       = baseline.normStd;
  const threshold = baseline.threshold || 0.05;

  // Normalize vector
  const normalized = vector.map((v, i) => (v - mean[i]) / (std[i] || 1));

  // Compute reconstruction error (simplified server-side)
  // Full TF.js model runs in extension — server uses statistical baseline
  const errors = normalized.map((v, i) => Math.pow(v, 2));
  const mse    = errors.reduce((s, v) => s + v, 0) / errors.length;

  // Convert to trust score
  const ratio     = mse / threshold;
  const trustScore = Math.max(0, Math.min(100, Math.round((1 - Math.min(ratio / 3, 1)) * 100)));
  const riskLevel  = ratio < 0.6 ? 'low' : ratio < 1.0 ? 'medium' : ratio < 1.8 ? 'high' : 'critical';
  const anomaly    = riskLevel === 'high' || riskLevel === 'critical';

  return { trustScore, anomaly, riskLevel, error: mse, threshold };
}

// ── Update user baseline ─────────────────────
async function updateBaseline(userId, vector, existing) {
  const current = existing || { vectors: [], sampleCount: 0 };
  const vectors = [...(current.vectors || []), vector].slice(-500);
  const count   = (current.sampleCount || 0) + 1;

  // Compute normalization stats if enough samples
  let updates = { vectors, sampleCount: count };

  if (count >= 50 && count % 50 === 0) {
    const stats = computeNormStats(vectors);
    const threshold = calibrateThreshold(vectors, stats);
    updates = { ...updates, normMean: stats.mean, normStd: stats.std, threshold, trained: true };
  }

  await prisma.baseline.upsert({
    where:  { userId },
    update: updates,
    create: { userId, ...updates },
  });
}

// ── Handle anomaly ────────────────────────────
async function handleAnomaly({ userId, result, url, sessionId }) {
  // Get user's contact info
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { name: true, email: true, contactEmail: true, contactPhone: true },
  });

  if (!user) return;

  // Create alert record
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
  const contact = user.contactEmail || user.email;
  const time    = new Date().toLocaleString();

  await Promise.allSettled([
    sendAnomalyEmail({ to: contact, userName: user.name, trustScore: result.trustScore, url, time }),
    user.contactPhone ? sendAnomalySMS({ to: user.contactPhone, trustScore: result.trustScore, url }) : Promise.resolve(),
  ]);
}

// ── Normalization helpers ─────────────────────
function computeNormStats(vectors) {
  const n = vectors.length, dim = vectors[0].length;
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

export default router;
