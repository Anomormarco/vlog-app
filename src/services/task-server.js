require("dotenv/config");
const app = require("../apps/task-app");

const port = Number(process.env.TASK_SERVICE_PORT || 3002);

app.listen(port, () => {
  console.log(`Task service running on http://localhost:${port}`);
});
