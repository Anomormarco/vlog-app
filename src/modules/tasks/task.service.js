const { HttpError } = require("../../shared/utils/http-error");
const taskRepository = require("./task.repository");

const statuses = new Set(["TODO", "IN_PROGRESS", "DONE"]);
const priorities = new Set(["LOW", "MEDIUM", "HIGH"]);

function normalizeTaskInput(body, partial = false) {
  const data = {};

  if (!partial || body.title !== undefined) {
    if (!body.title || !String(body.title).trim()) {
      throw new HttpError(400, "title is required");
    }
    data.title = String(body.title).trim();
  }

  if (body.description !== undefined) {
    data.description = body.description ? String(body.description).trim() : null;
  }

  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase();
    if (!statuses.has(status)) {
      throw new HttpError(400, "Invalid task status");
    }
    data.status = status;
  }

  if (body.priority !== undefined) {
    const priority = String(body.priority).toUpperCase();
    if (!priorities.has(priority)) {
      throw new HttpError(400, "Invalid task priority");
    }
    data.priority = priority;
  }

  if (body.dueDate !== undefined) {
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (data.dueDate && Number.isNaN(data.dueDate.getTime())) {
      throw new HttpError(400, "Invalid dueDate");
    }
  }

  return data;
}

function normalizeFilters(query) {
  const filters = {
    search: query.search ? String(query.search).trim() : undefined,
    status: query.status ? String(query.status).toUpperCase() : undefined,
    priority: query.priority ? String(query.priority).toUpperCase() : undefined,
    sort: query.sort,
  };

  if (filters.status && !statuses.has(filters.status)) {
    throw new HttpError(400, "Invalid status filter");
  }

  if (filters.priority && !priorities.has(filters.priority)) {
    throw new HttpError(400, "Invalid priority filter");
  }

  return filters;
}

function createTask(userId, body) {
  return taskRepository.createTask(userId, normalizeTaskInput(body));
}

function listTasks(userId, query) {
  return taskRepository.listTasks(userId, normalizeFilters(query));
}

async function getTask(userId, id) {
  const task = await taskRepository.findTaskById(userId, Number(id));
  if (!task) {
    throw new HttpError(404, "Task not found");
  }
  return task;
}

async function updateTask(userId, id, body) {
  const taskId = Number(id);
  await getTask(userId, taskId);
  await taskRepository.updateTask(userId, taskId, normalizeTaskInput(body, true));
  return getTask(userId, taskId);
}

async function deleteTask(userId, id) {
  const taskId = Number(id);
  await getTask(userId, taskId);
  await taskRepository.deleteTask(userId, taskId);
}

module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
};
