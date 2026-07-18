import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { success, created } from '../../common/responses/index.js';
import { FEES } from '../../common/constants/index.js';

export async function initiateSettlement(req, res, next) {
  try {
    const { receivableId } = req.body;

    const receivable = await prisma.receivable.findUnique({
      where: { id: receivableId },
      include: { investments: { where: { status: 'ACTIVE' } } },
    });

    if (!receivable) throw AppError.notFound('Receivable not found');
    if (receivable.status !== 'FUNDED') throw AppError.badRequest('Receivable must be fully funded');

    const existing = await prisma.settlement.findUnique({ where: { receivableId } });
    if (existing) throw AppError.conflict('Settlement already initiated');

    const totalAmount = receivable.fundingAmount || receivable.totalAmount;
    const platformFee = totalAmount * (FEES.SETTLEMENT_FEE_PERCENT / 100);
    const netAmount = totalAmount - platformFee;

    const settlement = await prisma.$transaction(async (tx) => {
      const s = await tx.settlement.create({
        data: {
          receivableId,
          status: 'INITIATED',
          totalAmount,
          platformFee,
          netAmount,
          initiatedAt: new Date(),
        },
      });

      // Create distribution records for each investor
      for (const investment of receivable.investments) {
        const share = investment.amount / totalAmount;
        const principalShare = netAmount * share;
        const yieldShare = investment.expectedYield;

        await tx.settlementDistribution.create({
          data: {
            settlementId: s.id,
            investmentId: investment.id,
            amount: principalShare + yieldShare,
            principal: principalShare,
            yield: yieldShare,
          },
        });
      }

      await tx.receivable.update({ where: { id: receivableId }, data: { status: 'SETTLED', settledAt: new Date() } });

      return s;
    });

    return created(res, settlement, 'Settlement initiated. Awaiting Stellar transaction confirmation.');
  } catch (e) { next(e); }
}

export async function getSettlement(req, res, next) {
  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id: req.params.id },
      include: { distributions: { include: { investment: { select: { amount: true, investorOrgId: true } } } } },
    });
    if (!settlement) throw AppError.notFound('Settlement not found');
    return success(res, settlement);
  } catch (e) { next(e); }
}

export async function confirmSettlement(req, res, next) {
  try {
    const { stellarTxHash } = req.body;
    const settlement = await prisma.settlement.update({
      where: { id: req.params.id },
      data: {
        status: 'DISTRIBUTED',
        stellarTxHash,
        confirmedAt: new Date(),
        distributedAt: new Date(),
      },
    });

    // Update all investments to settled
    await prisma.investment.updateMany({
      where: { receivableId: settlement.receivableId },
      data: { status: 'SETTLED', settledAt: new Date() },
    });

    return success(res, settlement, 'Settlement confirmed and distributions processed');
  } catch (e) { next(e); }
}

export async function getOrgSettlements(req, res, next) {
  try {
    const settlements = await prisma.settlement.findMany({
      where: { receivable: { exporterId: req.user.organizationId } },
      include: { receivable: { select: { invoiceNumber: true, totalAmount: true, currency: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, settlements);
  } catch (e) { next(e); }
}
