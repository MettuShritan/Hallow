// ─────────────────────────────────────────────
//  Hallow — Database Client (Prisma)
// ─────────────────────────────────────────────
import { PrismaClient } from '@prisma/client';
import { config } from './index.js';

const prisma = new PrismaClient({
  log: config.isDev ? ['error', 'warn'] : ['error'],
});

export default prisma;
