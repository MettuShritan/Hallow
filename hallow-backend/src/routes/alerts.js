// ─────────────────────────────────────────────
//  Hallow — Alerts Routes
//  GET    /alerts         - list user alerts
//  PATCH  /alerts/:id     - mark as read
//  DELETE /alerts/:id     - delete alert
// ─────────────────────────────────────────────
import { Router } from 'express';
import prisma      from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /alerts
router.get('/', requireAuth, async (req, res) => {
  try {
    const { limit = 20, unread } = req.query;
    const alerts = await prisma.alert.findMany({
      where: {
        userId: req.user.userId,
        ...(unread === 'true' ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });
    const unreadCount = await prisma.alert.count({ where: { userId: req.user.userId, read: false } });
    res.json({ alerts, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// PATCH /alerts/:id — mark as read
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const alert = await prisma.alert.updateMany({
      where: { id: req.params.id, userId: req.user.userId },
      data:  { read: true },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// PATCH /alerts/read-all — mark all as read
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    await prisma.alert.updateMany({
      where: { userId: req.user.userId, read: false },
      data:  { read: true },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update alerts' });
  }
});

// DELETE /alerts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.alert.deleteMany({
      where: { id: req.params.id, userId: req.user.userId },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export default router;
