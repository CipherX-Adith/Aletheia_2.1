import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { success, paginated } from '../../common/responses/index.js';

export async function getQueue(req, res, next) {
  try {
    const { page = 1, limit = 20, status = 'PENDING' } = req.query;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.verificationRequest.findMany({
        where: { status },
        skip, take: +limit,
        orderBy: { createdAt: 'asc' },
        include: {
          organization: { select: { name: true, orgType: true } },
          receivable: { select: { invoiceNumber: true, totalAmount: true, currency: true } },
        },
      }),
      prisma.verificationRequest.count({ where: { status } }),
    ]);
    return paginated(res, items, { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function getMyVerifications(req, res, next) {
  try {
    const verifications = await prisma.verificationRequest.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { createdAt: 'desc' },
      include: { steps: true },
    });
    return success(res, verifications);
  } catch (e) { next(e); }
}

export async function getVerification(req, res, next) {
  try {
    const verification = await prisma.verificationRequest.findUnique({
      where: { id: req.params.id },
      include: {
        organization: true,
        receivable: { include: { documents: true } },
        steps: true,
      },
    });
    if (!verification) throw AppError.notFound('Verification not found');
    return success(res, verification);
  } catch (e) { next(e); }
}

export async function reviewVerification(req, res, next) {
  try {
    const { action, notes, stepId } = req.body; // action: APPROVE | REJECT
    const verification = await prisma.verificationRequest.findUnique({ where: { id: req.params.id } });
    if (!verification) throw AppError.notFound('Verification not found');

    if (action === 'APPROVE') {
      await prisma.$transaction(async (tx) => {
        await tx.verificationRequest.update({
          where: { id: req.params.id },
          data: { status: 'APPROVED', notes, reviewedAt: new Date() },
        });
        if (stepId) {
          await tx.verificationStep.update({
            where: { id: stepId },
            data: { status: 'APPROVED', completedAt: new Date() },
          });
        }
        // If receivable verification, mark receivable as verified
        if (verification.receivableId) {
          await tx.receivable.update({
            where: { id: verification.receivableId },
            data: { status: 'VERIFIED', verifiedAt: new Date() },
          });
        }
        // If KYB, activate trade passport
        if (verification.type === 'KYB') {
          await tx.tradePassport.update({
            where: { organizationId: verification.organizationId },
            data: { kybStatus: 'APPROVED', status: 'ACTIVE', issuedAt: new Date(), activeSince: new Date() },
          });
        }
      });
    } else if (action === 'REJECT') {
      await prisma.verificationRequest.update({
        where: { id: req.params.id },
        data: { status: 'REJECTED', notes, rejectionReason: req.body.reason, reviewedAt: new Date() },
      });
    }

    return success(res, null, `Verification ${action.toLowerCase()}d`);
  } catch (e) { next(e); }
}

export async function requestInfo(req, res, next) {
  try {
    const { notes } = req.body;
    await prisma.verificationRequest.update({
      where: { id: req.params.id },
      data: { status: 'INFO_REQUESTED', notes, requestedInfoAt: new Date() },
    });
    return success(res, null, 'Information requested');
  } catch (e) { next(e); }
}
