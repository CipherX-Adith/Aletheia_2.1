import { Router } from 'express';
import { authenticate, adminOnly, authorize } from '../../middleware/auth.middleware.js';
import * as ctrl from './verification.controller.js';

const router = Router();
router.use(authenticate);

router.get('/queue', authorize('PLATFORM_ADMIN', 'VERIFIER'), ctrl.getQueue);
router.get('/my', ctrl.getMyVerifications);
router.get('/:id', ctrl.getVerification);
router.put('/:id/review', authorize('PLATFORM_ADMIN', 'VERIFIER'), ctrl.reviewVerification);
router.post('/:id/request-info', authorize('PLATFORM_ADMIN', 'VERIFIER'), ctrl.requestInfo);

export default router;
