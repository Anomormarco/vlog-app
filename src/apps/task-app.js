const express = require("express");
const taskRoutes = require("../modules/tasks/task.routes");
const { errorHandler } = require("../shared/middlewares/error.middleware");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "task-service", status: "ok" });
});

app.use("/api/tasks", taskRoutes);

app.use(errorHandler);

module.exports = app;
