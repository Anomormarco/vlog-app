require("dotenv/config");
const mariadb = require("mariadb");

async function main() {
  const databaseUrl = new URL(process.env.DATABASE_URL);
  const databaseName = databaseUrl.pathname.replace(/^\//, "");
  const connection = await mariadb.createConnection({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  await connection.end();

  console.log(`Database ready: ${databaseName}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
