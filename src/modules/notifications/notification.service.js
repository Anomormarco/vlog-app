const notificationRepository = require("./notification.repository");

function toDto(notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    read: notification.read,
    postId: notification.postId,
    commentId: notification.commentId,
    actorId: notification.actorId,
    createdAt: notification.createdAt,
  };
}

async function listNotifications(userId) {
  const notifications = await notificationRepository.listNotifications(userId);
  return notifications.map(toDto);
}

async function markNotificationRead(notificationId, userId) {
  await notificationRepository.markNotificationRead(Number(notificationId), userId);
  return listNotifications(userId);
}

async function markAllRead(userId) {
  await notificationRepository.markAllRead(userId);
  return listNotifications(userId);
}

async function clearNotifications(userId) {
  await notificationRepository.deleteAllNotifications(userId);
  return { success: true };
}

function getRecipientAndActor(event) {
  const recipientId = Number(event.postAuthorId);
  const actorId = Number(event.commentAuthorId || event.actorId);

  if (!recipientId || !actorId || recipientId === actorId) {
    return null;
  }

  return { recipientId, actorId };
}

async function handleCommentCreated(event) {
  const ids = getRecipientAndActor(event);
  if (!ids) return;

  await notificationRepository.createNotification({
    userId: ids.recipientId,
    type: event.type,
    title: "New comment",
    body: `${event.commentAuthorName || "Someone"} commented on "${event.postTitle || "your post"}".`,
    postId: Number(event.postId),
    commentId: Number(event.commentId),
    actorId: ids.actorId,
  });
}

async function handleReactionCreated(event) {
  const ids = getRecipientAndActor(event);
  if (!ids) return;

  await notificationRepository.createNotification({
    userId: ids.recipientId,
    type: event.type,
    title: "New reaction",
    body: `${event.actorName || "Someone"} reacted ${event.reactionType || ""} to "${event.postTitle || "your post"}".`,
    postId: Number(event.postId),
    actorId: ids.actorId,
  });
}

async function handleEvent(event) {
  if (!event) return;

  if (event.type === "comment.created") {
    await handleCommentCreated(event);
    return;
  }

  if (event.type === "reaction.created") {
    await handleReactionCreated(event);
  }
}

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllRead,
  clearNotifications,
  handleEvent,
};
