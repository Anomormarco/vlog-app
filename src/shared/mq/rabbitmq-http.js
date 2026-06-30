const RABBITMQ_URL = process.env.RABBITMQ_URL || "http://localhost:15672";
const RABBITMQ_USER = process.env.RABBITMQ_USER || "guest";
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || "guest";
const NOTIFICATION_QUEUE = process.env.NOTIFICATION_QUEUE || "notifications.events";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006";
const NOTIFICATION_INTERNAL_SECRET =
  process.env.NOTIFICATION_INTERNAL_SECRET || "dev-notification-secret";

function authHeader() {
  return `Basic ${Buffer.from(`${RABBITMQ_USER}:${RABBITMQ_PASSWORD}`).toString("base64")}`;
}

function rabbitPath(path) {
  return `${RABBITMQ_URL}/api${path}`;
}

async function rabbitRequest(path, options = {}) {
  const response = await fetch(rabbitPath(path), {
    ...options,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RabbitMQ ${response.status}: ${body || response.statusText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function ensureNotificationQueue() {
  await rabbitRequest(`/queues/%2F/${encodeURIComponent(NOTIFICATION_QUEUE)}`, {
    method: "PUT",
    body: JSON.stringify({ durable: true }),
  });
}

async function publishNotificationEvent(event) {
  try {
    await ensureNotificationQueue();
    return await rabbitRequest("/exchanges/%2F/amq.default/publish", {
      method: "POST",
      body: JSON.stringify({
        properties: {
          delivery_mode: 2,
          content_type: "application/json",
        },
        routing_key: NOTIFICATION_QUEUE,
        payload: JSON.stringify(event),
        payload_encoding: "string",
      }),
    });
  } catch (error) {
    await publishNotificationEventDirect(event);
    return { fallback: "notification-service", error: error.message };
  }
}

async function publishNotificationEventDirect(event) {
  const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Notification-Secret": NOTIFICATION_INTERNAL_SECRET,
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notification service ${response.status}: ${body || response.statusText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function getNotificationEvents(count = 10) {
  await ensureNotificationQueue();
  return rabbitRequest(`/queues/%2F/${encodeURIComponent(NOTIFICATION_QUEUE)}/get`, {
    method: "POST",
    body: JSON.stringify({
      count,
      ackmode: "ack_requeue_false",
      encoding: "auto",
      truncate: 50000,
    }),
  });
}

module.exports = {
  publishNotificationEvent,
  getNotificationEvents,
};
