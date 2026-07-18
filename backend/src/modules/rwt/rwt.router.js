import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import * as ctrl from './rwt.controller.js';

const router = Router();
router.use(authenticate);

router.post('/tokenize/:receivableId', authorize('PLATFORM_ADMIN', 'ORG_ADMIN'), ctrl.tokenize);
router.get('/:id', ctrl.getToken);
router.post('/:id/burn', authorize('PLATFORM_ADMIN'), ctrl.burnToken);

export default router;
