import { createRequire } from 'module';
import path from 'path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from './env.js';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../generated/prisma/index.js');

const globalForPrisma = globalThis;

let localPrisma;
if (!globalForPrisma.prisma) {
  const dbPath = path.resolve(process.cwd(), 'dev.db');
  const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath });
  localPrisma = new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });
  globalForPrisma.prisma = localPrisma;
} else {
  localPrisma = globalForPrisma.prisma;
}

export const prisma = localPrisma;

export async function connectDatabase() {
  console.log('[DB] Connected to SQLite via Prisma Better-SQLite3');
}

export async function disconnectDatabase() {
  console.log('[DB] Disconnected from database');
}

export default prisma;
