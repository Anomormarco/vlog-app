const prisma = require("../../config/prisma");

function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

function createUser(data) {
  return prisma.user.create({
    data,
    select: { id: true, name: true, email: true, createdAt: true },
  });
}

module.exports = { findUserByEmail, createUser };
