const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const TaskController = require("../controllers/task.controller");

// API 16: Create task
router.post(
  "/projects/:projectId/tasks",
  auth,
  [
    body("title").notEmpty(),
    body("description").optional(),
    body("assignedTo").optional({ nullable: true }).isString(),
    body("priority").optional().isIn(["low", "medium", "high"]),
    body("dueDate").optional().isISO8601().toDate()
  ],
  validate,
  TaskController.createTask
);


// API 17: List tasks
router.get(
  "/projects/:projectId/tasks",
  auth,
  TaskController.listTasks
);

// API 18: Update task status
router.patch(
  "/tasks/:taskId/status",
  auth,
  [
    body("status").isIn(["todo", "in_progress", "completed"])
  ],
  validate,
  TaskController.updateStatus
);

// API 19: Update full task
router.put(
  "/tasks/:taskId",
  auth,
  TaskController.updateTask
);

module.exports = router;
