import { createRequire } from 'module';
import path from 'path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../generated/prisma/index.js');

const dbPath = path.resolve('dev.db');
const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    include: { organization: true }
  });
  console.log(JSON.stringify(users.map(u => ({
    email: u.email,
    role: u.role,
    orgType: u.organization?.orgType,
    orgName: u.organization?.name
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
