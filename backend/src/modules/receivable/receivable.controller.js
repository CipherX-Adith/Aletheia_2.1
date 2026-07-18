import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { success, created, paginated } from '../../common/responses/index.js';
import path from 'path';

export async function createReceivable(req, res, next) {
  try {
    const exporterId = req.user.organizationId;
    if (!exporterId) throw AppError.badRequest('No organization linked');

    const receivable = await prisma.receivable.create({
      data: { exporterId, ...req.body },
    });
    return created(res, receivable, 'Receivable created');
  } catch (e) { next(e); }
}

export async function listReceivables(req, res, next) {
  try {
    const { page = 1, limit = 20, status, exporterId } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    // Regular users see only their org's receivables
    if (req.user.role !== 'PLATFORM_ADMIN') where.exporterId = req.user.organizationId;
    else if (exporterId) where.exporterId = exporterId;

    const [receivables, total] = await Promise.all([
      prisma.receivable.findMany({
        where, skip, take: +limit,
        orderBy: { createdAt: 'desc' },
        include: { exporter: { select: { name: true } }, riskScore: true },
      }),
      prisma.receivable.count({ where }),
    ]);

    return paginated(res, receivables, { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function getReceivable(req, res, next) {
  try {
    const receivable = await prisma.receivable.findUnique({
      where: { id: req.params.id },
      include: {
        exporter: { select: { id: true, name: true, country: true } },
        documents: true,
        rwtToken: true,
        listing: true,
        riskScore: true,
        verificationRequest: { include: { steps: true } },
      },
    });
    if (!receivable) throw AppError.notFound('Receivable not found');
    return success(res, receivable);
  } catch (e) { next(e); }
}

export async function updateReceivable(req, res, next) {
  try {
    const receivable = await prisma.receivable.findUnique({ where: { id: req.params.id } });
    if (!receivable) throw AppError.notFound('Receivable not found');
    if (!['DRAFT'].includes(receivable.status)) {
      throw AppError.badRequest('Can only edit receivables in DRAFT status');
    }
    const updated = await prisma.receivable.update({ where: { id: req.params.id }, data: req.body });
    return success(res, updated, 'Receivable updated');
  } catch (e) { next(e); }
}

export async function deleteReceivable(req, res, next) {
  try {
    await prisma.receivable.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    return success(res, null, 'Receivable cancelled');
  } catch (e) { next(e); }
}

export async function submitReceivable(req, res, next) {
  try {
    const receivable = await prisma.receivable.findUnique({
      where: { id: req.params.id },
      include: { documents: true },
    });
    if (!receivable) throw AppError.notFound('Receivable not found');
    if (receivable.status !== 'DRAFT') throw AppError.badRequest('Receivable already submitted');

    await prisma.$transaction(async (tx) => {
      await tx.receivable.update({
        where: { id: req.params.id },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
      });
      // Create verification request
      await tx.verificationRequest.create({
        data: {
          organizationId: receivable.exporterId,
          receivableId: receivable.id,
          type: 'RECEIVABLE',
          steps: {
            create: [
              { stepName: 'Document Review' },
              { stepName: 'Invoice Verification' },
              { stepName: 'Buyer Confirmation' },
              { stepName: 'Risk Assessment' },
            ],
          },
        },
      });
    });

    return success(res, null, 'Receivable submitted for verification');
  } catch (e) { next(e); }
}

export async function uploadDocuments(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) throw AppError.badRequest('No files uploaded');

    const { documentType = 'OTHER' } = req.body;
    const docs = await Promise.all(
      req.files.map((file) =>
        prisma.receivableDocument.create({
          data: {
            receivableId: req.params.id,
            documentType,
            fileName: file.originalname,
            fileUrl: `/uploads/${file.filename}`,
            mimeType: file.mimetype,
            fileSizeBytes: file.size,
          },
        })
      )
    );

    return created(res, docs, `${docs.length} document(s) uploaded`);
  } catch (e) { next(e); }
}
