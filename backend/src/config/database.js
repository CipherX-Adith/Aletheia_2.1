import { createRequire } from 'module';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../generated/prisma/index.js');

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma;

export async function connectDatabase() {
  console.log('[DB] Connected to Neon PostgreSQL via Prisma');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('[DB] Disconnected from Neon PostgreSQL');
}

export default prisma;
