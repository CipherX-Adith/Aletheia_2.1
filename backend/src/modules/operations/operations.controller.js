import { prisma } from '../../config/database.js';
import { success, paginated } from '../../common/responses/index.js';

export async function listUsers(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip, take: +limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, organization: { select: { name: true, orgType: true } } },
      }),
      prisma.user.count(),
    ]);
    return paginated(res, users, { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function getUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, lastLoginAt: true, organization: true },
    });
    return success(res, user);
  } catch (e) { next(e); }
}

export async function toggleUserStatus(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !user.isActive } });
    return success(res, null, `User ${user.isActive ? 'deactivated' : 'activated'}`);
  } catch (e) { next(e); }
}

export async function listAllOrgs(req, res, next) {
  try {
    const { page = 1, limit = 20, orgType } = req.query;
    const skip = (page - 1) * limit;
    const where = orgType ? { orgType } : {};
    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({ where, skip, take: +limit, include: { tradePassport: { select: { status: true, kybStatus: true } }, _count: { select: { receivables: true } } } }),
      prisma.organization.count({ where }),
    ]);
    return paginated(res, orgs, { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function getPlatformStats(req, res, next) {
  try {
    const [users, orgs, receivables, investments, settlements] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.receivable.count(),
      prisma.investment.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
      prisma.settlement.aggregate({ _sum: { totalAmount: true }, _count: { _all: true } }),
    ]);
    return success(res, { users, organizations: orgs, receivables, investments, settlements });
  } catch (e) { next(e); }
}

export async function getAuditLog(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ skip, take: +limit, orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.count(),
    ]);
    return paginated(res, logs, { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}
