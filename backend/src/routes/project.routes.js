const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const ProjectController = require("../controllers/project.controller");

// API 12: Create project
router.post(
  "/projects",
  auth,
  [
    body("name").notEmpty(),
    body("description").optional(),
    body("status").optional().isIn(["active", "archived", "completed"])
  ],
  validate,
  ProjectController.createProject
);

// API 13: List projects
router.get(
  "/projects",
  auth,
  ProjectController.listProjects
);

// API 14: Update project
router.put(
  "/projects/:projectId",
  auth,
  ProjectController.updateProject
);

// API 15: Delete project
router.delete(
  "/projects/:projectId",
  auth,
  ProjectController.deleteProject
);

// API: Get single project
router.get(
  "/projects/:projectId",
  auth,
  ProjectController.getProject
);


module.exports = router;
