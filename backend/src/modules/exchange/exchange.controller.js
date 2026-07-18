import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { success, created, paginated } from '../../common/responses/index.js';
import { FEES } from '../../common/constants/index.js';

export async function listListings(req, res, next) {
  try {
    const { page = 1, limit = 20, currency, minYield, maxYield } = req.query;
    const skip = (page - 1) * limit;

    const where = { status: 'ACTIVE' };
    if (currency) where.receivable = { currency };

    const [listings, total] = await Promise.all([
      prisma.exchangeListing.findMany({
        where, skip, take: +limit,
        orderBy: { listedAt: 'desc' },
        include: {
          receivable: {
            select: {
              id: true, invoiceNumber: true, totalAmount: true, currency: true,
              commodity: true, originCountry: true, destinationCountry: true,
              buyerName: true, buyerCountry: true, dueDate: true,
              exporter: { select: { name: true, country: true } },
              riskScore: { select: { score: true, rating: true } },
            },
          },
        },
      }),
      prisma.exchangeListing.count({ where }),
    ]);

    return paginated(res, listings, { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function getListing(req, res, next) {
  try {
    const listing = await prisma.exchangeListing.findUnique({
      where: { id: req.params.id },
      include: {
        receivable: {
          include: {
            exporter: { select: { name: true, country: true } },
            riskScore: true,
            rwtToken: true,
          },
        },
        investments: {
          select: { amount: true, investedAt: true, status: true },
          orderBy: { investedAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!listing) throw AppError.notFound('Listing not found');
    return success(res, listing);
  } catch (e) { next(e); }
}

export async function createListing(req, res, next) {
  try {
    const { receivableId, minInvestment, maxInvestment, yieldRate, maturityDate } = req.body;

    const receivable = await prisma.receivable.findUnique({
      where: { id: receivableId },
      include: { rwtToken: true },
    });

    if (!receivable) throw AppError.notFound('Receivable not found');
    if (receivable.status !== 'TOKENIZED') throw AppError.badRequest('Receivable must be tokenized before listing');

    const existingListing = await prisma.exchangeListing.findUnique({ where: { receivableId } });
    if (existingListing) throw AppError.conflict('Receivable already listed');

    const listing = await prisma.$transaction(async (tx) => {
      const l = await tx.exchangeListing.create({
        data: {
          receivableId,
          targetAmount: receivable.fundingAmount || receivable.totalAmount,
          minInvestment: parseFloat(minInvestment),
          maxInvestment: maxInvestment ? parseFloat(maxInvestment) : null,
          yieldRate: parseFloat(yieldRate),
          maturityDate: new Date(maturityDate),
          listedAt: new Date(),
        },
      });

      await tx.receivable.update({ where: { id: receivableId }, data: { status: 'LISTED' } });
      return l;
    });

    return created(res, listing, 'Receivable listed on exchange');
  } catch (e) { next(e); }
}

export async function invest(req, res, next) {
  try {
    const { amount } = req.body;
    const investorOrgId = req.user.organizationId;

    const listing = await prisma.exchangeListing.findUnique({
      where: { id: req.params.id },
      include: { receivable: { include: { rwtToken: true } } },
    });

    if (!listing) throw AppError.notFound('Listing not found');
    if (listing.status !== 'ACTIVE') throw AppError.badRequest('Listing is not active');
    if (parseFloat(amount) < listing.minInvestment) {
      throw AppError.badRequest(`Minimum investment is ${listing.minInvestment} USDC`);
    }

    const available = listing.targetAmount - listing.raisedAmount;
    const investAmount = Math.min(parseFloat(amount), available);
    const tokenPrice = listing.receivable.rwtToken?.tokenPrice || 100;
    const tokensBought = investAmount / tokenPrice;
    const expectedYield = (investAmount * listing.yieldRate) / 100;

    const investment = await prisma.$transaction(async (tx) => {
      const inv = await tx.investment.create({
        data: {
          listingId: listing.id,
          investorOrgId,
          receivableId: listing.receivableId,
          amount: investAmount,
          tokensBought,
          tokenPrice,
          expectedYield,
          expectedReturn: investAmount + expectedYield,
          status: 'ACTIVE',
          investedAt: new Date(),
        },
      });

      const newRaised = listing.raisedAmount + investAmount;
      const isFullyFunded = newRaised >= listing.targetAmount;

      await tx.exchangeListing.update({
        where: { id: listing.id },
        data: {
          raisedAmount: newRaised,
          status: isFullyFunded ? 'FUNDED' : 'ACTIVE',
        },
      });

      if (isFullyFunded) {
        await tx.receivable.update({
          where: { id: listing.receivableId },
          data: { status: 'FUNDED', fundedAt: new Date() },
        });
      }

      return inv;
    });

    return created(res, investment, 'Investment placed successfully');
  } catch (e) { next(e); }
}

export async function closeListing(req, res, next) {
  try {
    await prisma.exchangeListing.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', closedAt: new Date() },
    });
    return success(res, null, 'Listing closed');
  } catch (e) { next(e); }
}
