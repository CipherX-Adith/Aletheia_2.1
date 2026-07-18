import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as ctrl from './ai.controller.js';

const router = Router();
router.use(authenticate);

router.get('/conversations', ctrl.listConversations);
router.post('/conversations', ctrl.createConversation);
router.get('/conversations/:id', ctrl.getConversation);
router.post('/conversations/:id/messages', [body('message').trim().notEmpty()], validate, ctrl.sendMessage);
router.post('/analyze/:receivableId', ctrl.analyzeReceivable);

export default router;
