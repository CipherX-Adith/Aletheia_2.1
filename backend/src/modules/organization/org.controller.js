import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { success, created, paginated } from '../../common/responses/index.js';

export async function createOrg(req, res, next) {
  try {
    const org = await prisma.organization.create({ data: { ...req.body } });
    return created(res, org, 'Organization created');
  } catch (e) { next(e); }
}

export async function listOrgs(req, res, next) {
  try {
    const { page = 1, limit = 20, orgType } = req.query;
    const skip = (page - 1) * limit;
    const where = orgType ? { orgType } : {};
    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({ where, skip, take: +limit, orderBy: { createdAt: 'desc' } }),
      prisma.organization.count({ where }),
    ]);
    return paginated(res, orgs, { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function getOrg(req, res, next) {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: { tradePassport: true, wallet: { select: { publicKey: true, network: true, usdcBalance: true, xlmBalance: true } } },
    });
    if (!org) throw AppError.notFound('Organization not found');
    return success(res, org);
  } catch (e) { next(e); }
}

export async function updateOrg(req, res, next) {
  try {
    const allowed = ['name', 'legalName', 'website', 'phone', 'email', 'description', 'address', 'city', 'state'];
    const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const org = await prisma.organization.update({ where: { id: req.params.id }, data });
    return success(res, org, 'Organization updated');
  } catch (e) { next(e); }
}

export async function getMembers(req, res, next) {
  try {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: req.params.id, isActive: true },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    return success(res, members);
  } catch (e) { next(e); }
}

export async function inviteMember(req, res, next) {
  try {
    const { email, role = 'ORG_MEMBER' } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw AppError.notFound('User not found with this email');
    const member = await prisma.organizationMember.create({
      data: { userId: user.id, organizationId: req.params.id, role },
    });
    return created(res, member, 'Member invited');
  } catch (e) { next(e); }
}

export async function updateMemberRole(req, res, next) {
  try {
    const { role } = req.body;
    await prisma.organizationMember.update({
      where: { userId_organizationId: { userId: req.params.userId, organizationId: req.params.id } },
      data: { role },
    });
    return success(res, null, 'Role updated');
  } catch (e) { next(e); }
}

export async function removeMember(req, res, next) {
  try {
    await prisma.organizationMember.update({
      where: { userId_organizationId: { userId: req.params.userId, organizationId: req.params.id } },
      data: { isActive: false },
    });
    return success(res, null, 'Member removed');
  } catch (e) { next(e); }
}
