import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { success, paginated } from '../../common/responses/index.js';

export async function listInvestments(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    const where = { investorOrgId: req.user.organizationId };
    if (status) where.status = status;

    const [investments, total] = await Promise.all([
      prisma.investment.findMany({
        where, skip, take: +limit,
        orderBy: { investedAt: 'desc' },
        include: {
          receivable: { select: { invoiceNumber: true, currency: true, dueDate: true, buyerName: true } },
          listing: { select: { yieldRate: true, maturityDate: true } },
        },
      }),
      prisma.investment.count({ where }),
    ]);

    return paginated(res, investments, { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function getInvestment(req, res, next) {
  try {
    const investment = await prisma.investment.findUnique({
      where: { id: req.params.id },
      include: {
        receivable: true,
        listing: true,
        distributions: true,
      },
    });
    if (!investment) throw AppError.notFound('Investment not found');
    return success(res, investment);
  } catch (e) { next(e); }
}

export async function getPortfolioSummary(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const investments = await prisma.investment.findMany({
      where: { investorOrgId: orgId },
      select: { amount: true, expectedReturn: true, expectedYield: true, status: true },
    });

    const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
    const totalExpectedReturn = investments.reduce((s, i) => s + i.expectedReturn, 0);
    const activeInvestments = investments.filter((i) => i.status === 'ACTIVE').length;
    const settledInvestments = investments.filter((i) => i.status === 'SETTLED').length;

    return success(res, {
      totalInvested,
      totalExpectedReturn,
      totalExpectedYield: totalExpectedReturn - totalInvested,
      activeInvestments,
      settledInvestments,
      totalInvestments: investments.length,
    });
  } catch (e) { next(e); }
}
