const prisma = require("../../config/prisma");

function listNotifications(userId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

function createNotification(data) {
  return prisma.notification.create({ data });
}

function markNotificationRead(id, userId) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

function markAllRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

function deleteAllNotifications(userId) {
  return prisma.notification.deleteMany({ where: { userId } });
}

module.exports = {
  listNotifications,
  createNotification,
  markNotificationRead,
  markAllRead,
  deleteAllNotifications,
};
