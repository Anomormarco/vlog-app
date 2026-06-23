const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const { errorHandler } = require("../shared/middlewares/error.middleware");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "user-service", status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", authRoutes);

app.use(errorHandler);

module.exports = app;
