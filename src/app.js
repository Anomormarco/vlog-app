const express = require("express");
const authRoutes = require("./modules/auth/auth.routes");
const postRoutes = require("./modules/posts/post.routes");
const commentRoutes = require ("./modules/comments/comment.routes")
const { errorHandler } = require("./shared/middlewares/error.middleware");


const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments",commentRoutes);

app.use(errorHandler);

module.exports = app;


