require("dotenv/config");
const app = require("../apps/user-app");

const port = Number(process.env.USER_SERVICE_PORT || 3001);

app.listen(port, () => {
  console.log(`User service running on http://localhost:${port}`);
});
