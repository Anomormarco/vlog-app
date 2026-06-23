const prisma = require("../../config/prisma");
const { verifyJwt } = require("../utils/jwt");
const { HttpError } = require("../utils/http-error");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new HttpError(401, "Bearer token required");
    }

    const payload = verifyJwt(token);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
      throw new HttpError(401, "User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authMiddleware };
