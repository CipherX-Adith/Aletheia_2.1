import { prisma } from '../../config/database.js';
import { success } from '../../common/responses/index.js';

export async function getDashboard(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const isPlatformAdmin = req.user.role === 'PLATFORM_ADMIN';

    let orgType = null;
    if (orgId) {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { orgType: true }
      });
      orgType = org?.orgType;
    }

    const whereExporter = isPlatformAdmin ? {} : { exporterId: orgId };
    const whereInvestor = isPlatformAdmin ? {} : { investorOrgId: orgId };
    const whereSettlement = isPlatformAdmin ? {} : { receivable: { exporterId: orgId } };

    const [
      receivableCount,
      investmentCount,
      totalFunded,
      pendingSettlement,
      activeReceivableCount,
      payablesCount,
      payablesOutstanding,
      payablesSettled,
      payablesUpcoming,
      investmentsStats
    ] = await Promise.all([
      // General/Exporter
      prisma.receivable.count({ where: whereExporter }),
      prisma.investment.count({ where: whereInvestor }),
      prisma.receivable.aggregate({ where: { ...whereExporter, status: 'FUNDED' }, _sum: { fundingAmount: true } }),
      prisma.settlement.count({ where: { ...whereSettlement, status: { in: ['INITIATED', 'PROCESSING'] } } }),
      
      // Exporter specific active
      orgId ? prisma.receivable.count({
        where: { exporterId: orgId, status: { in: ['SUBMITTED', 'UNDER_VERIFICATION', 'VERIFIED', 'TOKENIZED', 'LISTED'] } }
      }) : Promise.resolve(0),
      
      // Buyer specific
      orgId ? prisma.receivable.count({ where: { buyerId: orgId } }) : Promise.resolve(0),
      orgId ? prisma.receivable.aggregate({
        where: { buyerId: orgId, status: { notIn: ['SETTLED', 'CANCELLED'] } },
        _sum: { totalAmount: true }
      }) : Promise.resolve({ _sum: { totalAmount: null } }),
      orgId ? prisma.receivable.count({ where: { buyerId: orgId, status: 'SETTLED' } }) : Promise.resolve(0),
      orgId ? prisma.receivable.count({ where: { buyerId: orgId, status: 'FUNDED' } }) : Promise.resolve(0),

      // Investor specific
      orgId ? prisma.investment.aggregate({
        where: { investorOrgId: orgId },
        _sum: { amount: true, expectedReturn: true },
        _avg: { expectedYield: true }
      }) : Promise.resolve({ _sum: { amount: null, expectedReturn: null }, _avg: { expectedYield: null } })
    ]);

    return success(res, {
      role: req.user.role,
      orgType,
      receivables: {
        total: receivableCount,
        active: activeReceivableCount
      },
      investments: {
        total: investmentCount,
        investedAmount: investmentsStats?._sum?.amount || 0,
        avgYield: investmentsStats?._avg?.expectedYield || 0,
        expectedReturn: investmentsStats?._sum?.expectedReturn || 0
      },
      funded: {
        total: totalFunded?._sum?.fundingAmount || 0,
      },
      pendingSettlements: pendingSettlement,
      payables: {
        total: payablesCount,
        outstanding: payablesOutstanding?._sum?.totalAmount || 0,
        settled: payablesSettled,
        upcoming: payablesUpcoming
      }
    });
  } catch (e) { next(e); }
}

export async function getReceivableStats(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const isPlatformAdmin = req.user.role === 'PLATFORM_ADMIN';
    const where = isPlatformAdmin ? {} : { exporterId: orgId };

    const stats = await prisma.receivable.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      _sum: { totalAmount: true },
    });
    return success(res, stats);
  } catch (e) { next(e); }
}

export async function getInvestmentStats(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const isPlatformAdmin = req.user.role === 'PLATFORM_ADMIN';
    const where = isPlatformAdmin ? {} : { investorOrgId: orgId };

    const stats = await prisma.investment.aggregate({
      where,
      _sum: { amount: true, expectedYield: true, expectedReturn: true },
      _count: { _all: true },
      _avg: { expectedYield: true },
    });
    return success(res, stats);
  } catch (e) { next(e); }
}

export async function getSettlementStats(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const isPlatformAdmin = req.user.role === 'PLATFORM_ADMIN';
    const where = isPlatformAdmin ? {} : { receivable: { exporterId: orgId } };

    const stats = await prisma.settlement.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      _sum: { totalAmount: true },
    });
    return success(res, stats);
  } catch (e) { next(e); }
}
