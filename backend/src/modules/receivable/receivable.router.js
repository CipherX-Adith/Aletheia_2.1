import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { uploadMultiple } from '../../middleware/upload.middleware.js';
import * as ctrl from './receivable.controller.js';

const router = Router();
router.use(authenticate);

router.post('/', [
  body('invoiceNumber').trim().notEmpty(),
  body('invoiceDate').isISO8601(),
  body('dueDate').isISO8601(),
  body('totalAmount').isFloat({ min: 1 }),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD']),
  body('commodity').trim().notEmpty(),
  body('originCountry').trim().notEmpty(),
  body('destinationCountry').trim().notEmpty(),
  body('buyerName').trim().notEmpty(),
  body('buyerCountry').trim().notEmpty(),
], validate, ctrl.createReceivable);

router.get('/', ctrl.listReceivables);
router.get('/:id', ctrl.getReceivable);
router.put('/:id', ctrl.updateReceivable);
router.delete('/:id', ctrl.deleteReceivable);
router.post('/:id/submit', ctrl.submitReceivable);
router.post('/:id/documents', uploadMultiple, ctrl.uploadDocuments);

export default router;
