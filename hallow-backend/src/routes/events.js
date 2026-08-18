// ─────────────────────────────────────────────
//  Hallow — Events Route
//  POST /events         — ingest event batch
//  GET  /events/status  — queue status
//  GET  /events/history — user event history
// ─────────────────────────────────────────────
import { Router } from 'express';
import { z }       from 'zod';
import prisma      from '../config/db.js';
import { requireAuth }  from '../middleware/auth.js';
import { eventLimiter } from '../middleware/rateLimit.js';
import { pushEvents }   from '../services/eventQueue.js';
import { scoreVector, handleAnomaly } from '../services/scoringService.js';

const router = Router();

// ── Validation ───────────────────────────────
const eventSchema = z.object({
  sessionId: z.string(),
  url:       z.string().optional(),
  features: z.object({
    vector:     z.array(z.number()).length(12),
    timestamp:  z.number().optional(),
    keystrokes: z.object({
      avgDwell:    z.number().optional(),
      stdDwell:    z.number().optional(),
      avgFlight:   z.number().optional(),
      typingSpeed: z.number().optional(),
    }).optional(),
    mouse: z.object({
      avgSpeed:    z.number().optional(),
      straightness: z.number().optional(),
    }).optional(),
    scroll: z.object({
      avgDelta:   z.number().optional(),
      scrollRate: z.number().optional(),
    }).optional(),
  }),
  deviceInfo: z.object({
    platform:  z.string().optional(),
    userAgent: z.string().optional(),
  }).optional(),
});

const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(50),
});

// ── POST /events — ingest event batch ────────
router.post('/', requireAuth, eventLimiter, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Support both single event and batch
    const body   = Array.isArray(req.body.events)
      ? batchSchema.parse(req.body)
      : { events: [eventSchema.parse(req.body)] };

    // Attach userId to each event
    const events = body.events.map(e => ({
      ...e,
      userId,
      vector: e.features.vector,
      receivedAt: Date.now(),
    }));

    // For small batches — score immediately and return result
    if (events.length === 1) {
      const event  = events[0];
      const result = await scoreVector({
        userId,
        sessionId: event.sessionId,
        url:       event.url,
        vector:    event.vector,
      });

      // Update session
      await upsertSession(userId, event.sessionId, event.url, result);

      // Store event
      await prisma.event.create({
        data: {
          userId,
          sessionId: event.sessionId,
          url:       event.url,
          vector:    event.vector,
          trustScore: result.trustScore,
          riskLevel:  result.riskLevel,
          anomaly:    result.anomaly,
        },
      });

      // Handle anomaly
      if (result.anomaly) {
        handleAnomaly({ userId, result, url: event.url, sessionId: event.sessionId })
          .catch(console.error);
      }

      return res.json(result);
    }

    // For larger batches — queue them
    await pushEvents(events);
    res.json({ queued: events.length, message: 'Events queued for processing' });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid event data', details: err.errors });
    }
    console.error('[Events]', err);
    res.status(500).json({ error: 'Event ingestion failed' });
  }
});

// ── GET /events/status ────────────────────────
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId   = req.user.userId;
    const baseline = await prisma.baseline.findUnique({
      where:  { userId },
      select: { trained: true, sampleCount: true, threshold: true },
    });

    const recentSession = await prisma.session.findFirst({
      where:   { userId },
      orderBy: { lastActive: 'desc' },
      select:  { trustScore: true, riskLevel: true, anomaly: true, lastActive: true },
    });

    res.json({
      baseline: baseline || { trained: false, sampleCount: 0 },
      session:  recentSession,
      progress: baseline
        ? Math.min(100, Math.round((baseline.sampleCount / 50) * 100))
        : 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// ── GET /events/history ───────────────────────
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { limit = 50, anomalyOnly } = req.query;

    const events = await prisma.event.findMany({
      where: {
        userId: req.user.userId,
        ...(anomalyOnly === 'true' ? { anomaly: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take:    parseInt(limit),
      select: {
        id: true, url: true, trustScore: true,
        riskLevel: true, anomaly: true, createdAt: true,
      },
    });

    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ── GET /events/sessions ──────────────────────
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where:   { userId: req.user.userId },
      orderBy: { lastActive: 'desc' },
      take:    20,
      select: {
        sessionId: true, url: true, trustScore: true,
        riskLevel: true, anomaly: true, startedAt: true, lastActive: true,
      },
    });
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ── Helper ────────────────────────────────────
async function upsertSession(userId, sessionId, url, result) {
  await prisma.session.upsert({
    where:  { sessionId },
    update: {
      trustScore: result.trustScore,
      riskLevel:  result.riskLevel,
      anomaly:    result.anomaly,
      lastActive: new Date(),
      url,
    },
    create: {
      userId, sessionId, url,
      trustScore: result.trustScore,
      riskLevel:  result.riskLevel,
      anomaly:    result.anomaly,
    },
  });
}

export default router;
