import jwt from 'jsonwebtoken';
import { env } from './env.js';

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'reset_password',
  EMAIL_VERIFY: 'email_verify',
};

/**
 * Sign an access token (short-lived)
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: 'aletheia',
  });
}

/**
 * Sign a refresh token (long-lived)
 */
export function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'aletheia',
  });
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { issuer: 'aletheia' });
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: 'aletheia' });
}

/**
 * Sign a short-lived token for password reset or email verification
 */
export function signShortToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn, issuer: 'aletheia' });
}

export function verifyShortToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { issuer: 'aletheia' });
}

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signShortToken,
  verifyShortToken,
};
