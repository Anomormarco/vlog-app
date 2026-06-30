const express = require("express");
const notificationRoutes = require("../modules/notifications/notification.routes");
const { errorHandler } = require("../shared/middlewares/error.middleware");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "notification-service", status: "ok" });
});

app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

module.exports = app;
