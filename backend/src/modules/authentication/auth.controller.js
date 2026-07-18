import * as authService from './auth.service.js';
import { success, created } from '../../common/responses/index.js';
import { AppError } from '../../common/errors/AppError.js';

export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return created(res, result, 'Account created successfully');
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    return success(res, result, 'Login successful');
  } catch (err) { next(err); }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw AppError.badRequest('Refresh token required');
    const result = await authService.refreshTokens(refreshToken);
    return success(res, result, 'Tokens refreshed');
  } catch (err) { next(err); }
}

export async function logout(req, res, next) {
  try {
    return success(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    return success(res, user);
  } catch (err) { next(err); }
}

export async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    return success(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
}

export async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPassword(req.body.email);
    return success(res, null, 'If that email exists, a reset link has been sent');
  } catch (err) { next(err); }
}

export async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    return success(res, null, 'Password reset successfully');
  } catch (err) { next(err); }
}
