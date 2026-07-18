import bcrypt from 'bcrypt';
import { prisma } from '../../config/database.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, signShortToken, verifyShortToken } from '../../config/jwt.js';
import { AppError } from '../../common/errors/AppError.js';

const SALT_ROUNDS = 12;

export async function register({ email, password, firstName, lastName, orgName, orgType, country, legalName }) {
  // Check if email exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw AppError.conflict('Email already registered');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create org and user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: orgName,
        legalName: legalName || orgName,
        orgType,
        country,
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'ORG_ADMIN',
        organizationId: org.id,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    await tx.organizationMember.create({
      data: { userId: user.id, organizationId: org.id, role: 'ORG_ADMIN' },
    });

    // Create draft trade passport
    await tx.tradePassport.create({
      data: { organizationId: org.id },
    });

    return { user, org };
  });

  const accessToken = signAccessToken({ userId: result.user.id, role: result.user.role });
  const refreshToken = signRefreshToken({ userId: result.user.id });

  return { user: result.user, organization: result.org, accessToken, refreshToken };
}

export async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user || !user.isActive) throw AppError.unauthorized('Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw AppError.unauthorized('Invalid credentials');

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  const { passwordHash, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
}

export async function refreshTokens(refreshToken) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) throw AppError.unauthorized('Invalid refresh token');

    const newAccessToken = signAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ userId: user.id });
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, isActive: true, lastLoginAt: true,
      organization: {
        select: { id: true, name: true, orgType: true, country: true },
      },
    },
  });
  if (!user) throw AppError.notFound('User not found');
  return user;
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw AppError.badRequest('Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Silent — don't reveal if email exists

  const token = signShortToken({ userId: user.id, type: 'reset' }, '1h');
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });
  // TODO: Send email with reset link
}

export async function resetPassword(token, newPassword) {
  let payload;
  try {
    payload = verifyShortToken(token);
  } catch {
    throw AppError.badRequest('Invalid or expired reset token');
  }

  const user = await prisma.user.findFirst({
    where: {
      id: payload.userId,
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) throw AppError.badRequest('Invalid or expired reset token');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
  });
}
