const express = require("express");
const postRoutes = require("../modules/posts/post.routes");
const { errorHandler } = require("../shared/middlewares/error.middleware");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ service: "vlog-service", status: "ok" });
});

app.use("/api/posts", postRoutes);

app.use(errorHandler);

module.exports = app;
