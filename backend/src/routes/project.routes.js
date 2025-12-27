const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project.controller");
const auth = require("../middleware/auth.middleware");

// CREATE
router.post("/", auth, projectController.createProject);

// LIST
router.get("/", auth, projectController.listProjects);

// GET BY ID ✅
router.get("/:id", auth, projectController.getProjectById);

// UPDATE
router.put("/:projectId", auth, projectController.updateProject);

// DELETE
router.delete("/:projectId", auth, projectController.deleteProject);

module.exports = router;
