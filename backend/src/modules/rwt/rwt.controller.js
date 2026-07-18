import { prisma } from '../../config/database.js';
import { AppError } from '../../common/errors/AppError.js';
import { success, created } from '../../common/responses/index.js';
import { v4 as uuidv4 } from 'uuid';
import { isOnChainIssuanceConfigured, issueReceivableAsset } from '../../blockchain/stellar.service.js';

export async function tokenize(req, res, next) {
  try {
    const receivable = await prisma.receivable.findUnique({
      where: { id: req.params.receivableId },
      include: { exporter: { include: { wallet: true } } },
    });

    if (!receivable) throw AppError.notFound('Receivable not found');
    if (receivable.status !== 'VERIFIED') throw AppError.badRequest('Receivable must be verified before tokenization');

    const existing = await prisma.rWTToken.findUnique({ where: { receivableId: receivable.id } });
    if (existing) throw AppError.conflict('Receivable already tokenized');

    // Generate asset code (RWT + first 4 chars of invoice number)
    const assetCode = `RWT${receivable.invoiceNumber.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase()}`;
    const fundingAmount = receivable.discountRate
      ? receivable.totalAmount * (1 - receivable.discountRate / 100)
      : receivable.totalAmount;

    const tokenPrice = 100; // 1 RWT = 100 USDC
    const totalSupply = Math.floor(fundingAmount / tokenPrice);

    const onChainAsset = isOnChainIssuanceConfigured() ? await issueReceivableAsset(assetCode) : null;
    const token = await prisma.$transaction(async (tx) => {
      const rwt = await tx.rWTToken.create({
        data: {
          receivableId: receivable.id,
          assetCode,
          assetIssuer: onChainAsset?.issuer || receivable.exporter?.wallet?.publicKey || 'PENDING_ONCHAIN_ISSUER',
          totalSupply,
          availableSupply: totalSupply,
          tokenPrice,
          mintedAt: new Date(),
          stellarAssetId: onChainAsset?.assetId,
          mintTxHash: onChainAsset?.txHash,
        },
      });

      await tx.receivable.update({
        where: { id: receivable.id },
        data: {
          status: 'TOKENIZED',
          tokenizedAt: new Date(),
          fundingAmount,
        },
      });

      return rwt;
    });

    return created(res, token, onChainAsset
      ? 'Receivable tokenized and Stellar asset controls configured.'
      : 'Receivable tokenized in application state. Configure Stellar issuer credentials before production issuance.');
  } catch (e) { next(e); }
}

export async function getToken(req, res, next) {
  try {
    const token = await prisma.rWTToken.findUnique({
      where: { id: req.params.id },
      include: { receivable: { select: { invoiceNumber: true, totalAmount: true, currency: true, status: true } } },
    });
    if (!token) throw AppError.notFound('RWT Token not found');
    return success(res, token);
  } catch (e) { next(e); }
}

export async function burnToken(req, res, next) {
  try {
    const token = await prisma.rWTToken.update({
      where: { id: req.params.id },
      data: { isActive: false, burntAt: new Date() },
    });
    return success(res, token, 'RWT Token burned');
  } catch (e) { next(e); }
}
