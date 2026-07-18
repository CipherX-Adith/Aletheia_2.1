import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as ctrl from './analytics.controller.js';

const router = Router();
router.use(authenticate);

router.get('/dashboard', ctrl.getDashboard);
router.get('/receivables', ctrl.getReceivableStats);
router.get('/investments', ctrl.getInvestmentStats);
router.get('/settlements', ctrl.getSettlementStats);

export default router;
