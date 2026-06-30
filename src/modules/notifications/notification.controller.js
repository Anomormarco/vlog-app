const notificationService = require("./notification.service");

async function listNotifications(req, res) {
  const notifications = await notificationService.listNotifications(req.user.id);
  res.json({ notifications });
}

async function markNotificationRead(req, res) {
  const notifications = await notificationService.markNotificationRead(
    req.params.notificationId,
    req.user.id
  );
  res.json({ notifications });
}

async function markAllRead(req, res) {
  const notifications = await notificationService.markAllRead(req.user.id);
  res.json({ notifications });
}

async function clearNotifications(req, res) {
  const result = await notificationService.clearNotifications(req.user.id);
  res.json(result);
}

async function handleNotificationEvent(req, res) {
  await notificationService.handleEvent(req.body);
  res.status(202).json({ accepted: true });
}

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllRead,
  clearNotifications,
  handleNotificationEvent,
};



