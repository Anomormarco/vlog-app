const express = require("express");

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_ORIGIN || "http://localhost:5173");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

const services = {
  user: process.env.USER_SERVICE_URL || "http://localhost:3001",
  vlog: process.env.VLOG_SERVICE_URL || "http://localhost:3002",
  task: process.env.TASK_SERVICE_URL || "http://localhost:3004",
  notification: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006",
};

app.get("/health", (req, res) => {
  res.json({ service: "api-gateway", status: "ok", services });
});

function proxyTo(targetBaseUrl) {
  return async (req, res) => {
    const targetUrl = new URL(req.originalUrl, targetBaseUrl);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "content-type": "application/json",
        authorization: req.headers.authorization || "",
      },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body || {}),
    });

    const text = await response.text();
    res.status(response.status);

    if (!text) {
      return res.send();
    }

    res.type(response.headers.get("content-type") || "application/json").send(text);
  };
}

app.use("/api/auth", proxyTo(services.user));
app.use("/api/users", proxyTo(services.user));
app.use("/api/posts", proxyTo(services.vlog));
app.use("/api/tasks", proxyTo(services.task));
app.use("/api/notifications", proxyTo(services.notification));

app.use((error, req, res, next) => {
  console.error(error);
  res.status(502).json({ message: "Gateway could not reach service" });
});

module.exports = app;
