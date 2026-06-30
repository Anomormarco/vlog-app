const { spawn } = require("child_process");

const services = [
  ["user-service", "src/services/user-server.js"],
  ["vlog-service", "src/services/vlog-server.js"],
  ["notification-service", "src/services/notification-server.js"],
  ["api-gateway", "src/services/gateway-server.js"],
];

for (const [name, file] of services) {
  const child = spawn(process.execPath, [file], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => {
    if (code) {
      console.error(`${name} exited with code ${code}`);
    }
  });
}
