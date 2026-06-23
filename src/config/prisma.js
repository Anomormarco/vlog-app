const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

function databaseConfig() {
  const databaseUrl = new URL(process.env.DATABASE_URL);

  return {
    host: databaseUrl.hostname === "localhost" ? "127.0.0.1" : databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.replace(/^\//, ""),
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 1),
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000),
    acquireTimeout: Number(process.env.DB_ACQUIRE_TIMEOUT_MS || 5000),
  };
}

const adapter = new PrismaMariaDb(databaseConfig());
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
