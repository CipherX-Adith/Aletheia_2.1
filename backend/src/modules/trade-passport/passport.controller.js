import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { success } from '../../common/responses/index.js';

export async function getMyPassport(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) throw AppError.badRequest('No organization linked to your account');
    const passport = await prisma.tradePassport.findUnique({
      where: { organizationId: orgId },
      include: { organization: { select: { name: true, orgType: true, country: true } } },
    });
    if (!passport) throw AppError.notFound('Trade Passport not found');
    return success(res, passport);
  } catch (e) { next(e); }
}

export async function getPassport(req, res, next) {
  try {
    const passport = await prisma.tradePassport.findUnique({
      where: { organizationId: req.params.orgId },
      include: { organization: { select: { name: true, orgType: true, country: true } } },
    });
    if (!passport) throw AppError.notFound('Trade Passport not found');
    return success(res, passport);
  } catch (e) { next(e); }
}

export async function updateStatus(req, res, next) {
  try {
    const { status, kybStatus } = req.body;
    const updated = await prisma.tradePassport.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(kybStatus && { kybStatus }),
        ...(status === 'ACTIVE' && { activeSince: new Date(), issuedAt: new Date() }),
      },
    });
    return success(res, updated, 'Trade Passport updated');
  } catch (e) { next(e); }
}

export async function getHistory(req, res, next) {
  try {
    const events = await prisma.tradePassportEvent.findMany({
      where: { tradePassportId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return success(res, events);
  } catch (e) { next(e); }
}

export async function getReputation(req, res, next) {
  try {
    const passport = await prisma.tradePassport.findUnique({
      where: { id: req.params.id },
      select: {
        trustScore: true, reputationScore: true, tradeVolume: true,
        successfulTrades: true, defaultCount: true, avgSettlementDays: true,
      },
    });
    if (!passport) throw AppError.notFound('Trade Passport not found');
    return success(res, passport);
  } catch (e) { next(e); }
}
