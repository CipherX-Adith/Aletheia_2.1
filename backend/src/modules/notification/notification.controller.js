import { prisma } from '../../config/database.js';
import { success } from '../../common/responses/index.js';

export async function listNotifications(req, res, next) {
  try {
    const { unreadOnly } = req.query;
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
    return success(res, { notifications, unreadCount });
  } catch (e) { next(e); }
}

export async function markRead(req, res, next) {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    return success(res, null, 'Marked as read');
  } catch (e) { next(e); }
}

export async function markAllRead(req, res, next) {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    return success(res, null, 'All notifications marked as read');
  } catch (e) { next(e); }
}

export async function deleteNotification(req, res, next) {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    return success(res, null, 'Notification deleted');
  } catch (e) { next(e); }
}
