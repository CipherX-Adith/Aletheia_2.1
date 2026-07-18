import { Router } from 'express';
import { authenticate, adminOnly } from '../../middleware/auth.middleware.js';
import * as ctrl from './operations.controller.js';

const router = Router();
router.use(authenticate, adminOnly);

router.get('/users', ctrl.listUsers);
router.get('/users/:id', ctrl.getUser);
router.put('/users/:id/status', ctrl.toggleUserStatus);
router.get('/organizations', ctrl.listAllOrgs);
router.get('/stats', ctrl.getPlatformStats);
router.get('/audit-log', ctrl.getAuditLog);

export default router;
