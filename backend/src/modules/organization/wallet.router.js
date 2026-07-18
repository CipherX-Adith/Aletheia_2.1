import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as ctrl from './wallet.controller.js';

const router = Router();
router.use(authenticate);

router.post('/create', ctrl.createWallet);
router.post('/connect', ctrl.connectWallet);
router.get('/balance', ctrl.getBalance);
router.get('/transactions', ctrl.getTransactions);
router.post('/fund-testnet', ctrl.fundTestnet);

export default router;
