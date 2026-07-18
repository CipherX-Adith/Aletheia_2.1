import { createRequire } from 'module';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../generated/prisma/index.js');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.settlementDistribution.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.investment.deleteMany({});
  await prisma.exchangeListing.deleteMany({});
  await prisma.rWTToken.deleteMany({});
  await prisma.receivableDocument.deleteMany({});
  await prisma.verificationStep.deleteMany({});
  await prisma.verificationRequest.deleteMany({});
  await prisma.receivable.deleteMany({});
  await prisma.walletTransaction.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.tradePassportEvent.deleteMany({});
  await prisma.tradePassport.deleteMany({});
  await prisma.organizationMember.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  const adminHash = await bcrypt.hash('admin123', 12);
  const exporterHash = await bcrypt.hash('exporter123', 12);
  const investorHash = await bcrypt.hash('investor123', 12);


  // 1. Platform Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@aletheia.trade',
      passwordHash: adminHash,
      firstName: 'Aletheia',
      lastName: 'Admin',
      role: 'PLATFORM_ADMIN',
      isEmailVerified: true,
    },
  });

  // 2. Exporter Organization
  const exporterOrg = await prisma.organization.create({
    data: {
      name: 'Global Textiles Export Inc.',
      legalName: 'Global Textiles Export Inc. Ltd.',
      orgType: 'EXPORTER',
      country: 'India',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: '404 Export Zone, Bandra East',
      taxId: 'TAX-IND-12345',
      registrationNumber: 'REG-IND-98765',
    },
  });

  const exporterUser = await prisma.user.create({
    data: {
      email: 'exporter@textiles.com',
      passwordHash: exporterHash,
      firstName: 'Rajesh',
      lastName: 'Sharma',
      role: 'ORG_ADMIN',
      organizationId: exporterOrg.id,
      isEmailVerified: true,
    },
  });

  await prisma.organizationMember.create({
    data: {
      userId: exporterUser.id,
      organizationId: exporterOrg.id,
      role: 'ORG_ADMIN',
    },
  });

  await prisma.tradePassport.create({
    data: {
      organizationId: exporterOrg.id,
      status: 'ACTIVE',
      kybStatus: 'APPROVED',
      trustScore: 85.5,
      reputationScore: 90.0,
      activeSince: new Date(),
      issuedAt: new Date(),
    },
  });

  await prisma.wallet.create({
    data: {
      organizationId: exporterOrg.id,
      publicKey: 'GBEXPORTERPUBLICKEYSTELLAR1234567890ABCDEFGHJKLMNOPQ',
      xlmBalance: 100.0,
      usdcBalance: 5000.0,
    },
  });

  // 3. Buyer Organization (Counterparty, Offline only - no user portal/login credentials)
  const buyerOrg = await prisma.organization.create({
    data: {
      name: 'Euro Apparel Logistics',
      legalName: 'Euro Apparel Logistics GmbH',
      orgType: 'BUYER',
      country: 'Germany',
      city: 'Frankfurt',
      address: '12 Logistics Strasse',
      taxId: 'TAX-GER-9988',
      registrationNumber: 'REG-GER-1122',
    },
  });

  await prisma.tradePassport.create({
    data: {
      organizationId: buyerOrg.id,
      status: 'ACTIVE',
      kybStatus: 'APPROVED',
      trustScore: 92.0,
      reputationScore: 95.0,
      activeSince: new Date(),
      issuedAt: new Date(),
    },
  });

  await prisma.wallet.create({
    data: {
      organizationId: buyerOrg.id,
      publicKey: 'GBBUYERPUBLICKEYSTELLAR1234567890ABCDEFGHJKLMNOPQR',
      xlmBalance: 500.0,
      usdcBalance: 25000.0,
    },
  });


  // 4. Investor Organization
  const investorOrg = await prisma.organization.create({
    data: {
      name: 'Apex Trade Yield Fund',
      legalName: 'Apex Trade Yield Fund LP',
      orgType: 'INVESTOR',
      country: 'Singapore',
      city: 'Singapore',
      address: '88 Marina Boulevard',
      taxId: 'TAX-SGP-7766',
      registrationNumber: 'REG-SGP-3344',
    },
  });

  const investorUser = await prisma.user.create({
    data: {
      email: 'investor@apexfund.sg',
      passwordHash: investorHash,
      firstName: 'Lee',
      lastName: 'Wei',
      role: 'ORG_ADMIN',
      organizationId: investorOrg.id,
      isEmailVerified: true,
    },
  });

  await prisma.organizationMember.create({
    data: {
      userId: investorUser.id,
      organizationId: investorOrg.id,
      role: 'ORG_ADMIN',
    },
  });

  await prisma.tradePassport.create({
    data: {
      organizationId: investorOrg.id,
      status: 'ACTIVE',
      kybStatus: 'APPROVED',
      trustScore: 95.0,
      reputationScore: 98.0,
      activeSince: new Date(),
      issuedAt: new Date(),
    },
  });

  await prisma.wallet.create({
    data: {
      organizationId: investorOrg.id,
      publicKey: 'GBINVESTORPUBLICKEYSTELLAR1234567890ABCDEFGHJKLMNO',
      xlmBalance: 1000.0,
      usdcBalance: 150000.0,
    },
  });

  // 5. Sample Receivable (Invoice)
  const receivable = await prisma.receivable.create({
    data: {
      invoiceNumber: 'INV-2026-001',
      invoiceDate: new Date('2026-07-01'),
      dueDate: new Date('2026-10-01'),
      currency: 'USD',
      totalAmount: 50000.0,
      discountRate: 2.5,
      fundingAmount: 48750.0,
      commodity: 'Finished Cotton Garments',
      originCountry: 'India',
      destinationCountry: 'Germany',
      incoterms: 'FOB',
      buyerName: 'Euro Apparel Logistics',
      buyerCountry: 'Germany',
      status: 'DRAFT',
      exporterId: exporterOrg.id,
      buyerId: buyerOrg.id,
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
