require("dotenv/config");
const app = require("../apps/vlog-app");

const port = Number(process.env.VLOG_SERVICE_PORT || 3002);

app.listen(port, () => {
  console.log(`Vlog service running on http://localhost:${port}`);
});
