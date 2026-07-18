import * as StellarSdk from '@stellar/stellar-sdk';
import { prisma } from '../../config/database.js';
import { horizonServer, USDC_ASSET, NETWORK_PASSPHRASE } from '../../config/stellar.js';
import { AppError } from '../../common/errors/AppError.js';
import { success, created } from '../../common/responses/index.js';
import { logger } from '../../common/logger/index.js';

export async function createWallet(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) throw AppError.badRequest('No organization linked to your account');

    const existing = await prisma.wallet.findUnique({ where: { organizationId: orgId } });
    if (existing) throw AppError.conflict('Organization already has a wallet');

    // Generate Stellar keypair
    const keypair = StellarSdk.Keypair.random();
    const publicKey = keypair.publicKey();

    const wallet = await prisma.wallet.create({
      data: { organizationId: orgId, publicKey, network: 'testnet' },
    });

    // Return public key (NEVER store or return secret key)
    return created(res, {
      wallet: { id: wallet.id, publicKey: wallet.publicKey, network: wallet.network },
      // Return secret key ONCE for the user to save securely
      secretKey: keypair.secret(),
      warning: 'SAVE YOUR SECRET KEY NOW. It will never be shown again. Aletheia does not store secret keys.',
    }, 'Stellar wallet created');
  } catch (e) { next(e); }
}

export async function connectWallet(req, res, next) {
  try {
    const { publicKey } = req.body;
    if (!publicKey) throw AppError.badRequest('Public key required');

    // Validate the public key
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
      throw AppError.badRequest('Invalid Stellar public key');
    }

    const orgId = req.user.organizationId;
    if (!orgId) throw AppError.badRequest('No organization linked to your account');
    const wallet = await prisma.wallet.upsert({
      where: { organizationId: orgId },
      create: { organizationId: orgId, publicKey, network: 'testnet' },
      update: { publicKey },
    });

    return success(res, wallet, 'Wallet connected');
  } catch (e) { next(e); }
}

export async function getBalance(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) throw AppError.badRequest('No organization linked to your account');
    const wallet = await prisma.wallet.findUnique({ where: { organizationId: orgId } });
    if (!wallet) throw AppError.notFound('No wallet found');

    try {
      const account = await horizonServer.loadAccount(wallet.publicKey);
      let xlmBalance = '0', usdcBalance = '0';

      for (const bal of account.balances) {
        if (bal.asset_type === 'native') xlmBalance = bal.balance;
        if (bal.asset_code === 'USDC') usdcBalance = bal.balance;
      }

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { xlmBalance: parseFloat(xlmBalance), usdcBalance: parseFloat(usdcBalance), lastSyncedAt: new Date() },
      });

      return success(res, { publicKey: wallet.publicKey, xlm: xlmBalance, usdc: usdcBalance });
    } catch (e) {
      return success(res, { publicKey: wallet.publicKey, xlm: '0', usdc: '0', note: 'Account not yet funded on Stellar' });
    }
  } catch (e) { next(e); }
}

export async function getTransactions(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) throw AppError.badRequest('No organization linked to your account');
    const wallet = await prisma.wallet.findUnique({ where: { organizationId: orgId } });
    if (!wallet) throw AppError.notFound('No wallet found');

    const txs = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return success(res, txs);
  } catch (e) { next(e); }
}

export async function fundTestnet(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) throw AppError.badRequest('No organization linked to your account');
    const wallet = await prisma.wallet.findUnique({ where: { organizationId: orgId } });
    if (!wallet) throw AppError.notFound('No wallet found');

    // Use Stellar Friendbot to fund testnet account
    const response = await fetch(`https://friendbot.stellar.org?addr=${wallet.publicKey}`);
    if (!response.ok) throw AppError.internal('Failed to fund testnet account');

    return success(res, { message: 'Testnet account funded with 10,000 XLM', publicKey: wallet.publicKey });
  } catch (e) { next(e); }
}
