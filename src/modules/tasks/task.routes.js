const express = require("express");
const taskController = require("./task.controller");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { authMiddleware } = require("../../shared/middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/", asyncHandler(taskController.listTasks));
router.post("/", asyncHandler(taskController.createTask));
router.get("/:taskId", asyncHandler(taskController.getTask));
router.patch("/:taskId", asyncHandler(taskController.updateTask));
router.delete("/:taskId", asyncHandler(taskController.deleteTask));

module.exports = router;
