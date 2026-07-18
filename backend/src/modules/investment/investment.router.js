import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as ctrl from './investment.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.listInvestments);
router.get('/:id', ctrl.getInvestment);
router.get('/portfolio/summary', ctrl.getPortfolioSummary);

export default router;
