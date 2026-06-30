require("dotenv/config");
const app = require("../apps/notification-app");
const notificationService = require("../modules/notifications/notification.service");
const { getNotificationEvents } = require("../shared/mq/rabbitmq-http");

const port = Number(process.env.NOTIFICATION_SERVICE_PORT || process.env.PORT || 3006);
let consuming = false;

async function consumeNotificationEvents() {
  if (consuming) return;
  consuming = true;

  try {
    const messages = await getNotificationEvents(10);

    for (const message of messages) {
      const event =
        typeof message.payload === "string" ? JSON.parse(message.payload) : message.payload;
      await notificationService.handleEvent(event);
    }
  } catch (error) {
    console.error("Notification consumer error:", error.message);
  } finally {
    consuming = false;
  }
}

app.listen(port, () => {
  console.log(`Notification service running on http://localhost:${port}`);
  consumeNotificationEvents();
  setInterval(consumeNotificationEvents, Number(process.env.NOTIFICATION_POLL_MS || 2000));
});
