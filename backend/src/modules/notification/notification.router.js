import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as ctrl from './notification.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.listNotifications);
router.put('/:id/read', ctrl.markRead);
router.put('/read-all', ctrl.markAllRead);
router.delete('/:id', ctrl.deleteNotification);

export default router;
