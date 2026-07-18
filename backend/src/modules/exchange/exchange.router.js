import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as ctrl from './exchange.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.listListings);
router.get('/:id', ctrl.getListing);
router.post('/list', [
  body('receivableId').notEmpty(),
  body('minInvestment').isFloat({ min: 10 }),
  body('yieldRate').isFloat({ min: 0 }),
  body('maturityDate').isISO8601(),
], validate, ctrl.createListing);
router.post('/:id/invest', [
  body('amount').isFloat({ min: 10 }),
], validate, ctrl.invest);
router.put('/:id/close', ctrl.closeListing);

export default router;
