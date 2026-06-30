const express = require("express");
const notificationController = require("./notification.controller");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { authMiddleware } = require("../../shared/middlewares/auth.middleware");

const router = express.Router();

function internalNotificationMiddleware(req, res, next) {
  const expectedSecret = process.env.NOTIFICATION_INTERNAL_SECRET || "dev-notification-secret";

  if (req.headers["x-notification-secret"] !== expectedSecret) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
}

router.post(
  "/events",
  internalNotificationMiddleware,
  asyncHandler(notificationController.handleNotificationEvent)
);
router.get("/", authMiddleware, asyncHandler(notificationController.listNotifications));
router.patch("/read-all", authMiddleware, asyncHandler(notificationController.markAllRead));
router.patch("/:notificationId/read", authMiddleware, asyncHandler(notificationController.markNotificationRead));
router.delete("/", authMiddleware, asyncHandler(notificationController.clearNotifications));

module.exports = router;
