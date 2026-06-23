const taskService = require("./task.service");

async function createTask(req, res) {
  const task = await taskService.createTask(req.user.id, req.body);
  res.status(201).json({ task });
}

async function listTasks(req, res) {
  const tasks = await taskService.listTasks(req.user.id, req.query);
  res.json({ tasks });
}

async function getTask(req, res) {
  const task = await taskService.getTask(req.user.id, req.params.taskId);
  res.json({ task });
}

async function updateTask(req, res) {
  const task = await taskService.updateTask(req.user.id, req.params.taskId, req.body);
  res.json({ task });
}

async function deleteTask(req, res) {
  await taskService.deleteTask(req.user.id, req.params.taskId);
  res.status(204).send();
}

module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
};
