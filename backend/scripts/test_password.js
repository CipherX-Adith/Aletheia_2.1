import { createRequire } from 'module';
import path from 'path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcrypt';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../generated/prisma/index.js');

const dbPath = path.resolve('dev.db');
const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'investor@apexfund.sg' }
  });
  if (!user) {
    console.log('User not found');
    return;
  }
  const isMatch = await bcrypt.compare('investor123', user.passwordHash);
  console.log(`Password 'investor123' match: ${isMatch}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
