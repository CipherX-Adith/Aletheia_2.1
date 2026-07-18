import { verifyAccessToken } from '../config/jwt.js';
import { prisma } from '../config/database.js';
import { AppError } from '../common/errors/AppError.js';
import { USER_ROLES } from '../common/constants/index.js';

/**
 * Authenticate request via Bearer JWT
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        organizationId: true,
      },
    });

    if (!user) throw AppError.unauthorized('User not found');
    if (!user.isActive) throw AppError.unauthorized('Account is deactivated');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Restrict to specific roles
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden(`Role '${req.user.role}' is not allowed to access this resource`));
    }
    next();
  };
}

/**
 * Platform admin only
 */
export const adminOnly = authorize(USER_ROLES.PLATFORM_ADMIN);

/**
 * Org admin or platform admin
 */
export const orgAdminOrAbove = authorize(USER_ROLES.PLATFORM_ADMIN, USER_ROLES.ORG_ADMIN);

export default { authenticate, authorize, adminOnly, orgAdminOrAbove };
