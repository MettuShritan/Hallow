// ─────────────────────────────────────────────
//  Hallow — Devices Routes
//  GET    /devices        - list user devices
//  POST   /devices        - register device
//  PATCH  /devices/:id    - trust/untrust
//  DELETE /devices/:id    - remove device
// ─────────────────────────────────────────────
import { Router } from 'express';
import prisma      from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const devices = await prisma.device.findMany({
      where:   { userId: req.user.userId },
      orderBy: { lastSeen: 'desc' },
    });
    res.json({ devices });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, platform, userAgent } = req.body;
    const device = await prisma.device.create({
      data: { userId: req.user.userId, name, platform, userAgent, trusted: true },
    });
    res.status(201).json({ device });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register device' });
  }
});

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { trusted } = req.body;
    await prisma.device.updateMany({
      where: { id: req.params.id, userId: req.user.userId },
      data:  { trusted },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update device' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.device.deleteMany({
      where: { id: req.params.id, userId: req.user.userId },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove device' });
  }
});

export default router;
