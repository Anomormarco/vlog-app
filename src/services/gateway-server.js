require("dotenv/config");
const app = require("../apps/gateway-app");

const port = Number(process.env.GATEWAY_PORT || process.env.PORT || 3003);

app.listen(port, () => {
  console.log(`API Gateway running on http://localhost:${port}`);
});
