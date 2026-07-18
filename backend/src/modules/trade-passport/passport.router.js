import { Router } from 'express';
import { authenticate, adminOnly } from '../../middleware/auth.middleware.js';
import * as ctrl from './passport.controller.js';

const router = Router();
router.use(authenticate);

router.get('/my', ctrl.getMyPassport);
router.get('/:orgId', ctrl.getPassport);
router.put('/:id/status', adminOnly, ctrl.updateStatus);
router.get('/:id/history', ctrl.getHistory);
router.get('/:id/reputation', ctrl.getReputation);

export default router;
