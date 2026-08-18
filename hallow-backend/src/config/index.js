// ─────────────────────────────────────────────
//  Hallow — Backend Server
//  Entry point
// ─────────────────────────────────────────────
import express  from 'express';
import cors     from 'cors';
import helmet   from 'helmet';
import { config }        from './config/index.js';
import { apiLimiter }    from './middleware/rateLimit.js';
import { startWorker }   from './services/workerService.js';

// Routes
import authRoutes    from './routes/auth.js';
import eventsRoutes  from './routes/events.js';
import scoreRoutes   from './routes/score.js';
import alertRoutes   from './routes/alerts.js';
import deviceRoutes  from './routes/devices.js';

const app = express();

// ── Security middleware ──────────────────────
app.use(helmet());
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(apiLimiter);

// ── Health check ─────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    service: 'hallow-backend',
    version: '1.0.0',
    time:    new Date().toISOString(),
  });
});

// ── Routes ───────────────────────────────────
app.use('/auth',    authRoutes);
app.use('/events',  eventsRoutes);
app.use('/score',   scoreRoutes);
app.use('/alerts',  alertRoutes);
app.use('/devices', deviceRoutes);

// ── 404 ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Error handler ────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Hallow Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────
app.listen(config.port, () => {
  console.log(`
  ██╗  ██╗ █████╗ ██╗     ██╗      ██████╗ ██╗    ██╗
  ██║  ██║██╔══██╗██║     ██║     ██╔═══██╗██║    ██║
  ███████║███████║██║     ██║     ██║   ██║██║ █╗ ██║
  ██╔══██║██╔══██║██║     ██║     ██║   ██║██║███╗██║
  ██║  ██║██║  ██║███████╗███████╗╚██████╔╝╚███╔███╔╝
  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝  ╚══╝╚══╝

  🛡  Hallow Backend  ·  Port ${config.port}  ·  ${config.env}
  `);

  // Start background event worker
  startWorker();
});

export default app;
