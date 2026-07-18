import { Router } from 'express';
import authRoutes from '../modules/authentication/auth.router.js';
import orgRoutes from '../modules/organization/org.router.js';
import tradePassportRoutes from '../modules/trade-passport/passport.router.js';
import walletRoutes from '../modules/organization/wallet.router.js';
import receivableRoutes from '../modules/receivable/receivable.router.js';
import verificationRoutes from '../modules/verification/verification.router.js';
import rwtRoutes from '../modules/rwt/rwt.router.js';
import exchangeRoutes from '../modules/exchange/exchange.router.js';
import investmentRoutes from '../modules/investment/investment.router.js';
import settlementRoutes from '../modules/settlement/settlement.router.js';
import analyticsRoutes from '../modules/analytics/analytics.router.js';
import notificationRoutes from '../modules/notification/notification.router.js';
import aiRoutes from '../modules/ai/ai.router.js';
import operationsRoutes from '../modules/operations/operations.router.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organizations', orgRoutes);
router.use('/trade-passport', tradePassportRoutes);
router.use('/wallet', walletRoutes);
router.use('/receivables', receivableRoutes);
router.use('/verification', verificationRoutes);
router.use('/rwt', rwtRoutes);
router.use('/exchange', exchangeRoutes);
router.use('/investments', investmentRoutes);
router.use('/settlement', settlementRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);
router.use('/operations', operationsRoutes);

export default router;
