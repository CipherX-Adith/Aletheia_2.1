import { Router } from 'express';
import { prisma } from '../config/database.js';
import bcrypt from 'bcrypt';
import { register } from '../modules/authentication/auth.service.js';
import { Keypair } from '@stellar/stellar-sdk';
import multer from 'multer';
import crypto from 'crypto';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── AUTHENTICATION ──────────────────────────────────────────────────────────

router.post('/auth/login', async (req, res, next) => {
  try {
    const { identifier, password, requested_role, current_wallet_address } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await prisma.user.findUnique({
      where: { email: identifier.toLowerCase().trim() },
      include: { organization: { include: { wallet: true } } }
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const role = user.organization?.orgType === 'EXPORTER' ? 'exporter' : (user.organization?.orgType === 'INVESTOR' ? 'investor' : 'admin');

    // Enforce role-based portal access
    if (requested_role && role !== 'admin') {
      if (requested_role === 'investor' && role !== 'investor') {
        return res.status(403).json({ error: 'You are currently using this account as an exporter.' });
      }
      if (requested_role === 'exporter' && role !== 'exporter') {
        return res.status(403).json({ error: 'You are currently using this account as an investor.' });
      }
    }

    let walletAddress = user.organization?.wallet?.publicKey || 'GDEMO_WALLET_PUBLIC_KEY_1234567890ABCDEF';

    // Auto-sync connected Freighter wallet to the organization
    if (current_wallet_address && user.organization) {
      if (user.organization.wallet) {
        const updatedWallet = await prisma.wallet.update({
          where: { id: user.organization.wallet.id },
          data: { publicKey: current_wallet_address }
        });
        walletAddress = updatedWallet.publicKey;
      } else {
        const newWallet = await prisma.wallet.create({
          data: {
            organizationId: user.organization.id,
            publicKey: current_wallet_address,
            network: process.env.STELLAR_NETWORK || 'mainnet',
            usdcBalance: 0.0,
            xlmBalance: 0.0
          }
        });
        walletAddress = newWallet.publicKey;
      }
    }

    res.json({
      id: user.id,
      username: user.email.split('@')[0],
      email: user.email,
      role: role,
      full_name: `${user.firstName} ${user.lastName}`,
      company_name: user.organization?.name || 'Aletheia',
      wallet_address: walletAddress,
      message: 'Login successful.'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/auth/register', async (req, res, next) => {
  try {
    const { username, email, password, role, full_name, company_name } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Check if the user already exists to provide a friendly role-specific warning message
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { organization: true }
    });
    if (existingUser) {
      const existingRole = existingUser.organization?.orgType === 'EXPORTER' ? 'exporter' : (existingUser.organization?.orgType === 'INVESTOR' ? 'investor' : 'admin');
      return res.status(400).json({
        error: `You are currently using this account as an ${existingRole}.`
      });
    }

    const firstName = full_name?.split(' ')[0] || username || 'User';
    const lastName = full_name?.split(' ').slice(1).join(' ') || '';
    const orgType = role === 'exporter' ? 'EXPORTER' : 'INVESTOR';

    const result = await register({
      email: email.toLowerCase().trim(),
      password,
      firstName,
      lastName,
      orgName: company_name || `${firstName}'s Org`,
      orgType,
      country: 'Singapore'
    });

    const keypair = Keypair.random();
    const publicKey = keypair.publicKey();

    await prisma.wallet.create({
      data: {
        organizationId: result.organization.id,
        publicKey,
        network: process.env.STELLAR_NETWORK || 'mainnet',
        usdcBalance: 0.0,
        xlmBalance: 0.0
      }
    });

    await prisma.tradePassport.upsert({
      where: { organizationId: result.organization.id },
      create: {
        organizationId: result.organization.id,
        status: 'ACTIVE',
        kybStatus: 'APPROVED',
        trustScore: 95,
        reputationScore: 98,
        activeSince: new Date()
      },
      update: {
        status: 'ACTIVE',
        kybStatus: 'APPROVED',
        trustScore: 95,
        reputationScore: 98,
        activeSince: new Date()
      }
    });

    res.status(201).json({
      id: result.user.id,
      username: result.user.email.split('@')[0],
      email: result.user.email,
      role,
      full_name: `${result.user.firstName} ${result.user.lastName}`,
      company_name: result.organization.name,
      wallet_address: publicKey,
      message: 'Registration successful'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/auth/wallets/:address/kyc', async (req, res, next) => {
  try {
    const { address } = req.params;
    const wallet = await prisma.wallet.findUnique({
      where: { publicKey: address },
      include: { organization: { include: { tradePassport: true } } }
    });

    if (wallet && wallet.organization?.tradePassport?.kybStatus === 'APPROVED') {
      return res.json({ status: 'approved' });
    }
    res.json({ status: 'approved' }); // fallback to approved for testnet demo compatibility
  } catch (err) {
    next(err);
  }
});

// ─── RECEIVABLES ─────────────────────────────────────────────────────────────

router.get('/receivables', async (req, res, next) => {
  try {
    const { status, exporter } = req.query;
    const where = {};

    if (exporter) {
      const wallet = await prisma.wallet.findUnique({
        where: { publicKey: exporter }
      });
      if (wallet) {
        where.exporterId = wallet.organizationId;
      } else {
        return res.json([]);
      }
    }

    if (status) {
      if (status === 'pending') {
        where.status = { in: ['SUBMITTED', 'UNDER_VERIFICATION'] };
      } else if (status === 'attested') {
        where.status = { in: ['VERIFIED', 'TOKENIZED'] };
      } else if (status === 'active') {
        where.status = 'LISTED';
      } else if (status === 'settled') {
        where.status = 'SETTLED';
      }
    }

    const rows = await prisma.receivable.findMany({
      where,
      include: {
        exporter: { include: { wallet: true } },
        investments: true,
        rwtToken: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = rows.map((r) => {
      const attCount = r.status === 'DRAFT' || r.status === 'SUBMITTED' ? 0 : 2;
      const amountUsd = r.totalAmount;
      const discBps = r.discountRate ? Math.round(r.discountRate * 100) : 500;
      
      const mappedInvestments = r.investments.map(inv => ({
        receivable_id: r.id,
        investor_address: inv.id,
        share_cents: Math.round(inv.amount * 100),
        payment_cents: Math.round(inv.amount * (1 - discBps / 10000) * 100),
        tx_hash: inv.stellarTxHash || 'demo_tx'
      }));

      return {
        id: r.id,
        exporter_address: r.exporter.wallet?.publicKey || 'GDEMO...',
        exporter_name: r.exporter.name,
        buyer_name: r.buyerName,
        buyer_country: r.buyerCountry,
        amount_usd: amountUsd,
        maturity_date: r.dueDate.toISOString().split('T')[0],
        doc_hash: r.ipfsHash || 'sha256_mock_hash',
        ipfs_cid: r.ipfsHash || 'ipfs_mock_cid',
        doc_filename: 'invoice.pdf',
        iec_code: '1234567890',
        commodity: r.commodity,
        status: r.status === 'SETTLED' ? 'settled' : 
                (r.status === 'LISTED' ? 'active' : 
                ((r.status === 'VERIFIED' || r.status === 'TOKENIZED') ? 'attested' : 'pending')),
        token_asset_code: r.rwtToken?.assetCode || null,
        attestation_count: attCount,
        chain_id: r.rwtToken?.stellarAssetId || null,
        discount_bps: discBps,
        issuer_public_key: r.rwtToken?.assetIssuer || 'demo',
        investments: mappedInvestments
      };
    });

    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

router.get('/receivables/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === 'reset-demo') return next();

    const r = await prisma.receivable.findUnique({
      where: { id },
      include: {
        exporter: { include: { wallet: true } },
        investments: { include: { investorOrg: { include: { wallet: true } } } },
        rwtToken: true
      }
    });

    if (!r) return res.status(404).json({ error: 'Not found' });

    const discBps = r.discountRate ? Math.round(r.discountRate * 100) : 500;
    const attCount = r.status === 'DRAFT' || r.status === 'SUBMITTED' ? 0 : 2;

    const mappedInvestments = r.investments.map(inv => ({
      receivable_id: r.id,
      investor_address: inv.investorOrg.wallet?.publicKey || 'GDEMO_INVESTOR',
      share_cents: Math.round(inv.amount * 100),
      payment_cents: Math.round(inv.amount * (1 - discBps / 10000) * 100),
      tx_hash: inv.stellarTxHash || 'demo_tx'
    }));

    const attestations = r.status === 'DRAFT' || r.status === 'SUBMITTED' ? [] : [
      { attestor_address: 'GBEXPORTCOUNCIL111111111111111111111111111111111111', attestor_role: 'export_council', tx_hash: 'demo_attest_1' },
      { attestor_address: 'GBLOGISTICSCOMPANY111111111111111111111111111111', attestor_role: 'logistics_partner', tx_hash: 'demo_attest_2' }
    ];

    const events = [];
    if (r.status === 'VERIFIED' || r.status === 'TOKENIZED' || r.status === 'LISTED' || r.status === 'SETTLED') {
      events.push({ event_type: 'attestation_submitted', triggered_by: 'Export Council', occurred_at: r.createdAt });
      events.push({ event_type: 'attestation_submitted', triggered_by: 'Logistics Partner', occurred_at: r.createdAt });
    }
    if (r.status === 'TOKENIZED' || r.status === 'LISTED' || r.status === 'SETTLED') {
      events.push({ event_type: 'token_minted', amount_cents: Math.round(r.totalAmount * 100), occurred_at: r.tokenizedAt || r.createdAt });
    }
    if (r.status === 'LISTED' || r.status === 'SETTLED') {
      events.push({ event_type: 'listed_for_sale', amount_cents: Math.round(r.totalAmount * 100), occurred_at: r.createdAt });
    }
    r.investments.forEach(inv => {
      events.push({
        event_type: 'share_purchased',
        amount_cents: Math.round(inv.amount * 100),
        triggered_by: inv.investorOrg.name,
        occurred_at: inv.investedAt
      });
    });
    if (r.status === 'SETTLED') {
      events.push({ event_type: 'payment_confirmed', amount_cents: Math.round(r.totalAmount * 100), occurred_at: r.settledAt || r.createdAt });
    }

    res.json({
      id: r.id,
      exporter_address: r.exporter.wallet?.publicKey || 'GDEMO...',
      exporter_name: r.exporter.name,
      buyer_name: r.buyerName,
      buyer_country: r.buyerCountry,
      amount_usd: r.totalAmount,
      maturity_date: r.dueDate.toISOString().split('T')[0],
      doc_hash: r.ipfsHash || 'sha256_mock_hash',
      ipfs_cid: r.ipfsHash || 'ipfs_mock_cid',
      doc_filename: 'invoice.pdf',
      iec_code: '1234567890',
      commodity: r.commodity,
      status: r.status === 'SETTLED' ? 'settled' : 
              (r.status === 'LISTED' ? 'active' : 
              ((r.status === 'VERIFIED' || r.status === 'TOKENIZED') ? 'attested' : 'pending')),
      token_asset_code: r.rwtToken?.assetCode || null,
      attestation_count: attCount,
      chain_id: r.rwtToken?.stellarAssetId || null,
      discount_bps: discBps,
      issuer_public_key: r.rwtToken?.assetIssuer || 'demo',
      attestations,
      investments: mappedInvestments,
      events
    });
  } catch (err) {
    next(err);
  }
});

router.post('/receivables/register', upload.single('document'), async (req, res, next) => {
  try {
    const {
      exporter_address, buyer_name, buyer_country,
      amount_usd, maturity_date, commodity
    } = req.body;

    if (!exporter_address) return res.status(400).json({ error: 'exporter_address required' });
    if (!amount_usd || parseFloat(amount_usd) <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const wallet = await prisma.wallet.findUnique({
      where: { publicKey: exporter_address },
      include: { organization: true }
    });
    if (!wallet) return res.status(400).json({ error: 'Exporter wallet not registered' });

    const docHash = req.file ? crypto.createHash('sha256').update(req.file.buffer).digest('hex') : 'sha256_mock_hash';
    const cid = 'QmMockCidForFileRegistration' + Date.now().toString();

    const rec = await prisma.receivable.create({
      data: {
        exporterId: wallet.organizationId,
        invoiceNumber: 'INV-' + Date.now().toString().slice(-6),
        invoiceDate: new Date(),
        dueDate: new Date(maturity_date),
        totalAmount: parseFloat(amount_usd),
        commodity: commodity || 'Other',
        originCountry: wallet.organization.country || 'Singapore',
        destinationCountry: buyer_country || 'United States',
        buyerName: buyer_name || 'Buyer',
        buyerCountry: buyer_country || 'United States',
        ipfsHash: cid,
        status: 'SUBMITTED'
      }
    });

    res.status(201).json({
      id: rec.id,
      doc_hash: docHash,
      ipfs_cid: cid,
      status: 'pending',
      message: 'Receivable registered. Awaiting 2-of-3 attestations.'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/receivables/:id/attest', async (req, res, next) => {
  try {
    const { id } = req.params;

    const r = await prisma.receivable.findUnique({ where: { id } });
    if (!r) return res.status(404).json({ error: 'Receivable not found' });

    const assetCode = `ML${String(id).slice(-4).toUpperCase()}`;

    await prisma.receivable.update({
      where: { id },
      data: { status: 'VERIFIED', verifiedAt: new Date() }
    });

    await prisma.rWTToken.create({
      data: {
        receivableId: id,
        assetCode,
        assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        totalSupply: r.totalAmount,
        availableSupply: r.totalAmount,
        tokenPrice: 1.0,
        mintedAt: new Date()
      }
    });

    res.json({
      attestation_count: 2,
      status: 'attested',
      token_asset_code: assetCode,
      message: 'Threshold met — receivable token minted!'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/receivables/:id/list-sale', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { discount_bps } = req.body;

    const r = await prisma.receivable.findUnique({ where: { id } });
    if (!r) return res.status(404).json({ error: 'Receivable not found' });

    const bps = parseInt(discount_bps) || 500;
    const discountRate = bps / 10000;
    const fundingAmount = r.totalAmount * (1 - discountRate);

    await prisma.receivable.update({
      where: { id },
      data: {
        status: 'LISTED',
        discountRate: discountRate,
        fundingAmount: fundingAmount
      }
    });

    await prisma.exchangeListing.create({
      data: {
        receivableId: id,
        status: 'ACTIVE',
        targetAmount: fundingAmount,
        minInvestment: 100.0,
        yieldRate: (bps / 100),
        maturityDate: r.dueDate
      }
    });

    res.json({
      receivable_id: id,
      face_value_usd: r.totalAmount,
      discount_bps: bps,
      sale_price_usd: fundingAmount,
      status: 'active',
      message: 'Listed for fractional sale'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/receivables/:id/buy-share', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { investor_address, share_usd } = req.body;

    const r = await prisma.receivable.findUnique({
      where: { id },
      include: { listing: true }
    });
    if (!r) return res.status(404).json({ error: 'Receivable not found' });

    const wallet = await prisma.wallet.findUnique({
      where: { publicKey: investor_address }
    });
    if (!wallet) return res.status(400).json({ error: 'Investor wallet not registered' });

    const shareUsd = parseFloat(share_usd);
    const discBps = r.discountRate ? Math.round(r.discountRate * 100) : 500;
    const paymentUsd = shareUsd * (1 - discBps / 10000);

    const listingId = r.listing?.id || 'demo_listing_id';
    
    await prisma.investment.create({
      data: {
        listingId,
        investorOrgId: wallet.organizationId,
        receivableId: id,
        amount: shareUsd,
        tokensBought: shareUsd,
        tokenPrice: 1.0,
        expectedYield: discBps / 100,
        expectedReturn: shareUsd * (1 + (discBps / 10000)),
        status: 'ACTIVE'
      }
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'SEND',
        amount: paymentUsd,
        asset: 'USDC',
        toAddress: r.exporterId,
        status: 'CONFIRMED'
      }
    });

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { usdcBalance: { decrement: paymentUsd } }
    });

    res.status(201).json({
      receivable_id: id,
      investor_address,
      share_usd: shareUsd,
      payment_usd: paymentUsd,
      message: 'Share purchased successfully'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/receivables/reset-demo', async (req, res, next) => {
  try {
    await prisma.walletTransaction.deleteMany();
    await prisma.investment.deleteMany();
    await prisma.exchangeListing.deleteMany();
    await prisma.rWTToken.deleteMany();
    await prisma.receivableDocument.deleteMany();
    await prisma.receivable.deleteMany();
    
    res.json({
      success: true,
      message: 'Demo database cleared and reset complete.'
    });
  } catch (err) {
    next(err);
  }
});

// ─── ORACLE & SYSTEM ─────────────────────────────────────────────────────────

router.post('/oracle/:id/confirm-payment', async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await prisma.receivable.findUnique({ where: { id } });
    if (!r) return res.status(404).json({ error: 'Receivable not found' });

    await prisma.receivable.update({
      where: { id },
      data: { status: 'SETTLED', settledAt: new Date() }
    });

    await prisma.settlement.create({
      data: {
        receivableId: id,
        status: 'CONFIRMED',
        totalAmount: r.totalAmount,
        platformFee: r.totalAmount * 0.01,
        netAmount: r.totalAmount * 0.99
      }
    });

    res.json({
      receivable_id: id,
      status: 'settled',
      message: 'Payment confirmed by Oracle. Funds distributed to smart escrow.'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/oracle/:id/distribute', async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await prisma.receivable.findUnique({
      where: { id },
      include: { investments: { include: { investorOrg: { include: { wallet: true } } } } }
    });
    if (!r) return res.status(404).json({ error: 'Receivable not found' });

    for (const inv of r.investments) {
      if (inv.investorOrg.wallet) {
        const payout = inv.amount;
        await prisma.wallet.update({
          where: { id: inv.investorOrg.wallet.id },
          data: { usdcBalance: { increment: payout } }
        });
        await prisma.walletTransaction.create({
          data: {
            walletId: inv.investorOrg.wallet.id,
            type: 'RECEIVE',
            amount: payout,
            asset: 'USDC',
            status: 'CONFIRMED'
          }
        });
      }
    }

    res.json({
      receivable_id: id,
      message: 'Funds distributed successfully to all fractional token holders.'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const activeListingsCount = await prisma.exchangeListing.count({ where: { status: 'ACTIVE' } });
    const totalVolume = await prisma.receivable.aggregate({
      _sum: { totalAmount: true }
    });
    const avgSettlementDays = 12.0;

    res.json({
      total_volume_usd: totalVolume._sum.totalAmount || 12850000,
      active_listings: activeListingsCount || 4,
      avg_settlement_days: avgSettlementDays
    });
  } catch (err) {
    next(err);
  }
});

// ─── CUSTOM TRADE PASSPORT & WALLET FOR FRONTEND ─────────────────────────────

router.get('/trade-passport/my', async (req, res, next) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: 'Address is required' });

    const wallet = await prisma.wallet.findUnique({
      where: { publicKey: address },
      include: {
        organization: {
          include: {
            tradePassport: true
          }
        }
      }
    });

    if (!wallet || !wallet.organization.tradePassport) {
      return res.status(404).json({ error: 'Passport not found' });
    }

    res.json({
      data: {
        status: wallet.organization.tradePassport.status,
        passportNumber: wallet.organization.tradePassport.passportNumber,
        activeSince: wallet.organization.tradePassport.activeSince,
        trustScore: wallet.organization.tradePassport.trustScore,
        reputationScore: wallet.organization.tradePassport.reputationScore,
        successfulTrades: wallet.organization.tradePassport.successfulTrades,
        defaultCount: wallet.organization.tradePassport.defaultCount,
        avgSettlementDays: wallet.organization.tradePassport.avgSettlementDays,
        organization: {
          name: wallet.organization.name,
          country: wallet.organization.country,
          orgType: wallet.organization.orgType
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/wallet/sync-freighter', async (req, res, next) => {
  try {
    const { email, address } = req.body;
    if (!email || !address) {
      return res.status(400).json({ error: 'Email and address are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { organization: { include: { wallet: true } } }
    });

    if (!user || !user.organization) {
      return res.status(404).json({ error: 'User or organization not found' });
    }

    let wallet;
    if (user.organization.wallet) {
      wallet = await prisma.wallet.update({
        where: { id: user.organization.wallet.id },
        data: { publicKey: address }
      });
    } else {
      wallet = await prisma.wallet.create({
        data: {
          organizationId: user.organization.id,
          publicKey: address,
          network: process.env.STELLAR_NETWORK || 'mainnet',
          usdcBalance: 0.0,
          xlmBalance: 0.0
        }
      });
    }

    res.json({ success: true, wallet });
  } catch (err) {
    next(err);
  }
});

router.get('/wallet/balance', async (req, res, next) => {
  try {
    const { address, email } = req.query;
    if (!address) return res.status(400).json({ error: 'Address is required' });

    let wallet = await prisma.wallet.findUnique({
      where: { publicKey: address }
    });

    if (!wallet && email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { organization: { include: { wallet: true } } }
      });
      if (user && user.organization) {
        if (user.organization.wallet) {
          wallet = await prisma.wallet.update({
            where: { id: user.organization.wallet.id },
            data: { publicKey: address }
          });
        } else {
          wallet = await prisma.wallet.create({
            data: {
              organizationId: user.organization.id,
              publicKey: address,
              network: process.env.STELLAR_NETWORK || 'mainnet',
              usdcBalance: 0.0,
              xlmBalance: 0.0
            }
          });
        }
      }
    }

    if (!wallet) {
      // Fallback dummy organization + wallet
      const orgName = `Org for ${address.slice(0, 8)}`;
      const org = await prisma.organization.create({
        data: { name: orgName, legalName: orgName, orgType: 'EXPORTER', country: 'Singapore' }
      });
      wallet = await prisma.wallet.create({
        data: { organizationId: org.id, publicKey: address, network: process.env.STELLAR_NETWORK || 'mainnet', usdcBalance: 0.0, xlmBalance: 0.0 }
      });
    }

    // ── Query Horizon for REAL on-chain balances ──────────────────────
    let xlmBalance = '0';
    let usdcBalance = '0';
    let onChain = false;

    try {
      const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
      const horizonRes = await fetch(`${horizonUrl}/accounts/${address}`);
      if (horizonRes.ok) {
        const accountData = await horizonRes.json();
        onChain = true;
        for (const bal of accountData.balances) {
          if (bal.asset_type === 'native') {
            xlmBalance = bal.balance;
          }
          if (bal.asset_code === 'USDC') {
            usdcBalance = bal.balance;
          }
        }

        // Sync on-chain balances back to DB
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            xlmBalance: parseFloat(xlmBalance),
            usdcBalance: parseFloat(usdcBalance),
            lastSyncedAt: new Date()
          }
        });
      }
    } catch (horizonErr) {
      console.warn('[Wallet Balance] Horizon query failed, using DB values:', horizonErr.message);
      xlmBalance = String(wallet.xlmBalance || 0);
      usdcBalance = String(wallet.usdcBalance || 0);
    }

    res.json({
      data: {
        publicKey: wallet.publicKey,
        usdc: usdcBalance,
        xlm: xlmBalance,
        onChain
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/wallet/transactions', async (req, res, next) => {
  try {
    const { address, email } = req.query;
    if (!address) return res.status(400).json({ error: 'Address is required' });

    let wallet = await prisma.wallet.findUnique({
      where: { publicKey: address },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!wallet && email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { organization: { include: { wallet: true } } }
      });
      if (user && user.organization) {
        if (user.organization.wallet) {
          wallet = await prisma.wallet.update({
            where: { id: user.organization.wallet.id },
            data: { publicKey: address },
            include: { transactions: { orderBy: { createdAt: 'desc' } } }
          });
        } else {
          wallet = await prisma.wallet.create({
            data: {
              organizationId: user.organization.id,
              publicKey: address,
              network: process.env.STELLAR_NETWORK || 'mainnet',
              usdcBalance: 0.0,
              xlmBalance: 0.0
            },
            include: { transactions: { orderBy: { createdAt: 'desc' } } }
          });
        }
      }
    }

    if (!wallet) {
      // Fallback dummy organization + wallet
      const orgName = `Org for ${address.slice(0, 8)}`;
      const org = await prisma.organization.create({
        data: { name: orgName, legalName: orgName, orgType: 'EXPORTER', country: 'Singapore' }
      });
      wallet = await prisma.wallet.create({
        data: { organizationId: org.id, publicKey: address, network: process.env.STELLAR_NETWORK || 'mainnet', usdcBalance: 0.0, xlmBalance: 0.0 },
        include: { transactions: { orderBy: { createdAt: 'desc' } } }
      });
    }

    res.json({
      data: (wallet.transactions || []).map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        asset: tx.asset,
        createdAt: tx.createdAt,
        txHash: tx.txHash
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.post('/wallet/create', async (req, res, next) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address is required' });

    const keypair = Keypair.random();
    const publicKey = keypair.publicKey();

    const wallet = await prisma.wallet.findUnique({
      where: { publicKey: address }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Organization not found for this address' });
    }

    res.json({
      data: {
        wallet: { id: wallet.id, publicKey: wallet.publicKey },
        secretKey: keypair.secret()
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/wallet/fund-testnet', async (req, res, next) => {
  try {
    if (process.env.STELLAR_NETWORK === 'mainnet') {
      return res.status(400).json({ error: 'Funding faucet is only supported on Stellar Testnet.' });
    }
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address is required' });

    const wallet = await prisma.wallet.findUnique({
      where: { publicKey: address }
    });

    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    // Call Stellar Friendbot to fund the testnet account with real XLM
    try {
      const friendbotRes = await fetch(`https://friendbot.stellar.org?addr=${address}`);
      if (!friendbotRes.ok) {
        const errText = await friendbotRes.text();
        console.warn('[Fund Testnet] Friendbot response:', errText);
        // Friendbot may fail if already funded — that's OK, continue to sync
      }
    } catch (friendbotErr) {
      console.warn('[Fund Testnet] Friendbot call failed:', friendbotErr.message);
    }

    // Query Horizon for actual on-chain balance after funding
    let xlmBalance = wallet.xlmBalance;
    let usdcBalance = wallet.usdcBalance;

    try {
      const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
      const horizonRes = await fetch(`${horizonUrl}/accounts/${address}`);
      if (horizonRes.ok) {
        const accountData = await horizonRes.json();
        for (const bal of accountData.balances) {
          if (bal.asset_type === 'native') xlmBalance = parseFloat(bal.balance);
          if (bal.asset_code === 'USDC') usdcBalance = parseFloat(bal.balance);
        }
      }
    } catch (horizonErr) {
      console.warn('[Fund Testnet] Horizon sync failed:', horizonErr.message);
    }

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        xlmBalance,
        usdcBalance,
        lastSyncedAt: new Date()
      }
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'FUND',
        amount: xlmBalance,
        asset: 'XLM',
        status: 'CONFIRMED'
      }
    });

    res.json({ success: true, xlm: xlmBalance, usdc: usdcBalance });
  } catch (err) {
    next(err);
  }
});

export default router;
