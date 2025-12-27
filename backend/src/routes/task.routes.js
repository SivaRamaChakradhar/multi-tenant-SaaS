const express = require("express");
const router = express.Router();

const taskController = require("../controllers/task.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post(
  "/projects/:projectId/tasks",
  authMiddleware,
  taskController.createTask
);

router.get(
  "/projects/:projectId/tasks",
  authMiddleware,
  taskController.listTasks
);

router.patch(
  "/tasks/:taskId/status",
  authMiddleware,
  taskController.updateTaskStatus
);

router.put(
  "/tasks/:taskId",
  authMiddleware,
  taskController.updateTask
);

module.exports = router;
