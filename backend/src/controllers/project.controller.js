const db = require("../config/db");
const { v4: uuid } = require("uuid");
const { logAction } = require("../services/audit");

class ProjectController {

  // --------------------------------------------------
  // API 12: CREATE PROJECT
  // --------------------------------------------------
  static createProject(req, res) {
    const { tenantId, userId } = req.user;
    const { name, description, status = "active" } = req.body;

    // Get tenant limits
    const tenant = db.prepare(
      `SELECT max_projects FROM tenants WHERE id=?`
    ).get(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    // Count projects
    const count = db.prepare(
      `SELECT COUNT(*) AS total FROM projects WHERE tenant_id=?`
    ).get(tenantId).total;

    if (count >= tenant.max_projects) {
      return res.status(403).json({
        success: false,
        message: "Project limit reached"
      });
    }

    const projectId = uuid();

    db.prepare(
      `
      INSERT INTO projects (id, tenant_id, name, description, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `
    ).run(projectId, tenantId, name, description || null, status, userId);

    logAction({
      tenantId,
      userId,
      action: "CREATE_PROJECT",
      entityType: "project",
      entityId: projectId
    });

    return res.status(201).json({
      success: true,
      data: {
        id: projectId,
        tenantId,
        name,
        description,
        status,
        createdBy: userId
      }
    });
  }

  // --------------------------------------------------
  // API 13: LIST PROJECTS
  // --------------------------------------------------
  static listProjects(req, res) {
    const { tenantId } = req.user;
    const { status, search = "" } = req.query;

    const projects = db.prepare(
      `
      SELECT p.id, p.name, p.description, p.status, p.created_at,
             u.full_name AS created_by_name,
             (SELECT COUNT(*) FROM tasks WHERE project_id=p.id) AS taskCount,
             (SELECT COUNT(*) FROM tasks WHERE project_id=p.id AND status='completed') AS completedTaskCount
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.tenant_id=?
        AND (p.name LIKE ?)
        AND (p.status = ? OR ? IS NULL)
      ORDER BY p.created_at DESC
    `
    ).all(
      tenantId,
      `%${search}%`,
      status,
      status
    );

    return res.json({
      success: true,
      data: {
        projects,
        total: projects.length
      }
    });
  }

  // --------------------------------------------------
  // API 14: UPDATE PROJECT
  // --------------------------------------------------
  static updateProject(req, res) {
    const { projectId } = req.params;
    const { tenantId, userId, role } = req.user;
    const { name, description, status } = req.body;

    const project = db.prepare(
      `SELECT * FROM projects WHERE id=?`
    ).get(projectId);

    if (!project || project.tenant_id !== tenantId) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // only creator or tenant_admin
    if (project.created_by !== userId && role !== "tenant_admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update"
      });
    }

    db.prepare(
      `
      UPDATE projects
      SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        updated_at = datetime('now')
      WHERE id=?
    `
    ).run(name, description, status, projectId);

    logAction({
      tenantId,
      userId,
      action: "UPDATE_PROJECT",
      entityType: "project",
      entityId: projectId
    });

    return res.json({
      success: true,
      message: "Project updated successfully"
    });
  }

  // --------------------------------------------------
  // API 15: DELETE PROJECT
  // --------------------------------------------------
  static deleteProject(req, res) {
    const { tenantId, userId, role } = req.user;
    const { projectId } = req.params;

    const project = db.prepare(
      `SELECT * FROM projects WHERE id=?`
    ).get(projectId);

    if (!project || project.tenant_id !== tenantId) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Only creator or admin
    if (project.created_by !== userId && role !== "tenant_admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    // delete tasks first
    db.prepare(`DELETE FROM tasks WHERE project_id=?`).run(projectId);

    db.prepare(`DELETE FROM projects WHERE id=?`).run(projectId);

    logAction({
      tenantId,
      userId,
      action: "DELETE_PROJECT",
      entityType: "project",
      entityId: projectId
    });

    return res.json({
      success: true,
      message: "Project deleted successfully"
    });
  }
  // --------------------------------------------------
// API: GET SINGLE PROJECT
// --------------------------------------------------
static async getProject(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = db
      .prepare(
        `SELECT p.*, u.full_name as creatorName 
         FROM projects p
         LEFT JOIN users u ON p.created_by = u.id
         WHERE p.id = ?`
      )
      .get(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    return res.json({
      success: true,
      data: { project }
    });

  } catch (err) {
    next(err);
  }
}

}

module.exports = ProjectController;
