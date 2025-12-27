const express = require("express");
const router = express.Router();

const projectController = require("../controllers/project.controller");
const authMiddleware = require("../middleware/auth.middleware");

/*
  API-12: Create Project
  POST /api/projects
*/
router.post(
  "/",
  authMiddleware,
  projectController.createProject
);

/*
  API-13: List Projects
  GET /api/projects
*/
router.get(
  "/",
  authMiddleware,
  projectController.listProjects
);

router.get("/:id", authMiddleware, projectController.getProjectById);

/*
  API-14: Update Project
  PUT /api/projects/:projectId
*/
router.put(
  "/:projectId",
  authMiddleware,
  projectController.updateProject
);

/*
  API-15: Delete Project
  DELETE /api/projects/:projectId
*/
router.delete(
  "/:projectId",
  authMiddleware,
  projectController.deleteProject
);

module.exports = router;
