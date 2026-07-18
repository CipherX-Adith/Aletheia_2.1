import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as authController from './auth.controller.js';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
    body('orgName').trim().notEmpty().withMessage('Organization name required'),
    body('orgType').notEmpty().withMessage('Organization type required'),
    body('country').trim().notEmpty().withMessage('Country required'),
  ],
  validate,
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  authController.login
);

// Refresh token
router.post('/refresh', authController.refresh);

// Logout
router.post('/logout', authenticate, authController.logout);

// Current user
router.get('/me', authenticate, authController.me);

// Change password
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  validate,
  authController.changePassword
);

// Forgot password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  authController.forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  authController.resetPassword
);

export default router;
