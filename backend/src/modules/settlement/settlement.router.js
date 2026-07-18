import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../../middleware/validate.middleware.js';
import { authenticate, adminOnly } from '../../middleware/auth.middleware.js';
import * as ctrl from './settlement.controller.js';

const router = Router();
router.use(authenticate);

router.post('/initiate', [body('receivableId').notEmpty()], validate, ctrl.initiateSettlement);
router.get('/:id', ctrl.getSettlement);
router.post('/:id/confirm', [body('stellarTxHash').notEmpty()], validate, ctrl.confirmSettlement);
router.get('/history/org', ctrl.getOrgSettlements);

export default router;
