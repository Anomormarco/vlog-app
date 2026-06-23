const { HttpError } = require("../../shared/utils/http-error");
const { hashPassword, verifyPassword } = require("../../shared/utils/password");
const { signJwt } = require("../../shared/utils/jwt");
const authRepository = require("./auth.repository");

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

async function register({ name, email, password }) {
  if (!name || !email || !password) {
    throw new HttpError(400, "name, email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await authRepository.findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new HttpError(409, "Email already registered");
  }

  const user = await authRepository.createUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
  });

  return {
    user,
    message: "User registered. Please login.",
  };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new HttpError(400, "email and password are required");
  }

  const user = await authRepository.findUserByEmail(email.toLowerCase().trim());

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, "Invalid email or password");
  }

  const safeUser = sanitizeUser(user);

  return {
    user: safeUser,
    token: signJwt({ sub: safeUser.id, email: safeUser.email }),
  };
}

module.exports = { register, login };
