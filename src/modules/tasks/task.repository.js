const prisma = require("../../config/prisma");

const taskInclude = {
  owner: { select: { id: true, name: true, email: true } },
};

function createTask(ownerId, data) {
  return prisma.task.create({
    data: { ...data, ownerId },
    include: taskInclude,
  });
}

function listTasks(ownerId, filters = {}) {
  const where = {
    ownerId,
    status: filters.status,
    priority: filters.priority,
  };

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  return prisma.task.findMany({
    where,
    orderBy: filters.sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" },
    include: taskInclude,
  });
}

function findTaskById(ownerId, id) {
  return prisma.task.findFirst({
    where: { id, ownerId },
    include: taskInclude,
  });
}

function updateTask(ownerId, id, data) {
  return prisma.task.updateMany({
    where: { id, ownerId },
    data,
  });
}

function deleteTask(ownerId, id) {
  return prisma.task.deleteMany({
    where: { id, ownerId },
  });
}

module.exports = {
  createTask,
  listTasks,
  findTaskById,
  updateTask,
  deleteTask,
};
