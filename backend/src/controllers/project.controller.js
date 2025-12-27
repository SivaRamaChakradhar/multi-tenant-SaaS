// backend/src/controllers/project.controller.js

const pool = require("../config/db");
const { logAction } = require("../services/audit.service");

/* =====================================================
   API-12: CREATE PROJECT
   POST /api/projects
===================================================== */
exports.createProject = async (req, res) => {
  const { name, description, status = "active" } = req.body;
  const { tenantId, userId } = req.user;

  try {
    // 1️⃣ Check project limit
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM projects WHERE tenant_id = $1`,
      [tenantId]
    );

    const tenantResult = await pool.query(
      `SELECT max_projects FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (
      +countResult.rows[0].count >= tenantResult.rows[0].max_projects
    ) {
      return res.status(403).json({
        success: false,
        message: "Project limit reached",
      });
    }

    // 2️⃣ Create project
    const projectResult = await pool.query(
      `
      INSERT INTO projects
      (tenant_id, name, description, status, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [tenantId, name, description, status, userId]
    );

    // 3️⃣ Audit log
    await logAction({
      tenantId,
      userId,
      action: "CREATE_PROJECT",
      entityType: "project",
      entityId: projectResult.rows[0].id,
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      data: projectResult.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   API-13: LIST PROJECTS
   GET /api/projects
===================================================== */
exports.listProjects = async (req, res) => {
  const { tenantId } = req.user;
  const { status, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClause = `WHERE p.tenant_id = $1`;
    const params = [tenantId];

    if (status) {
      params.push(status);
      whereClause += ` AND p.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      whereClause += ` AND LOWER(p.name) LIKE $${params.length}`;
    }

    const projectsResult = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.description,
        p.status,
        p.created_at,
        u.id AS creator_id,
        u.full_name AS creator_name,
        COUNT(t.id) AS task_count,
        COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_task_count
      FROM projects p
      JOIN users u ON u.id = p.created_by
      LEFT JOIN tasks t ON t.project_id = p.id
      ${whereClause}
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, limit, offset]
    );

    res.status(200).json({
      success: true,
      data: {
        projects: projectsResult.rows,
        pagination: {
          currentPage: Number(page),
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   API-14: UPDATE PROJECT
   PUT /api/projects/:projectId
===================================================== */
exports.updateProject = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId, userId, role } = req.user;
  const { name, description, status } = req.body;

  try {
    // 1️⃣ Verify project ownership
    const projectResult = await pool.query(
      `SELECT * FROM projects WHERE id = $1 AND tenant_id = $2`,
      [projectId, tenantId]
    );

    if (!projectResult.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const project = projectResult.rows[0];

    // 2️⃣ Authorization
    if (role !== "tenant_admin" && project.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    // 3️⃣ Update project
    const updatedProject = await pool.query(
      `
      UPDATE projects
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
      `,
      [name, description, status, projectId]
    );

    // 4️⃣ Audit log
    await logAction({
      tenantId,
      userId,
      action: "UPDATE_PROJECT",
      entityType: "project",
      entityId: projectId,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   API-15: DELETE PROJECT
   DELETE /api/projects/:projectId
===================================================== */
exports.deleteProject = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId, userId, role } = req.user;

  try {
    // 1️⃣ Verify project
    const projectResult = await pool.query(
      `SELECT * FROM projects WHERE id = $1 AND tenant_id = $2`,
      [projectId, tenantId]
    );

    if (!projectResult.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const project = projectResult.rows[0];

    // 2️⃣ Authorization
    if (role !== "tenant_admin" && project.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this project",
      });
    }

    // 3️⃣ Delete project (tasks auto-delete via CASCADE)
    await pool.query(
      `DELETE FROM projects WHERE id = $1`,
      [projectId]
    );

    // 4️⃣ Audit log
    await logAction({
      tenantId,
      userId,
      action: "DELETE_PROJECT",
      entityType: "project",
      entityId: projectId,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;

  const result = await pool.query(
    `
    SELECT *
    FROM projects
    WHERE id = $1 AND tenant_id = $2
    `,
    [id, tenantId]
  );

  if (!result.rowCount) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  res.status(200).json({
    success: true,
    data: result.rows[0],
  });
};

