import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../../middleware/validate.middleware.js';
import { authenticate, orgAdminOrAbove } from '../../middleware/auth.middleware.js';
import * as ctrl from './org.controller.js';

const router = Router();
router.use(authenticate);

router.post('/', [
  body('name').trim().notEmpty(),
  body('orgType').notEmpty(),
  body('country').trim().notEmpty(),
], validate, ctrl.createOrg);

router.get('/', ctrl.listOrgs);
router.get('/:id', param('id').notEmpty(), validate, ctrl.getOrg);
router.put('/:id', orgAdminOrAbove, ctrl.updateOrg);
router.get('/:id/members', ctrl.getMembers);
router.post('/:id/members', orgAdminOrAbove, ctrl.inviteMember);
router.put('/:id/members/:userId/role', orgAdminOrAbove, ctrl.updateMemberRole);
router.delete('/:id/members/:userId', orgAdminOrAbove, ctrl.removeMember);

export default router;
