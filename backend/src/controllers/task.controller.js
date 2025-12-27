// backend/src/controllers/task.controller.js

const pool = require("../config/db");
const { logAction } = require("../services/audit.service");

/* =====================================================
   API-16: CREATE TASK
   POST /api/projects/:projectId/tasks
===================================================== */
exports.createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, assignedTo, priority = "medium", dueDate } =
    req.body;
  const { userId, tenantId } = req.user;

  try {
    // 1️⃣ Verify project belongs to tenant
    const projectResult = await pool.query(
      `SELECT tenant_id FROM projects WHERE id = $1`,
      [projectId]
    );

    if (!projectResult.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (projectResult.rows[0].tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Project does not belong to your tenant",
      });
    }

    // 2️⃣ Validate assigned user (if provided)
    if (assignedTo) {
      const userCheck = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
        [assignedTo, tenantId]
      );

      if (!userCheck.rowCount) {
        return res.status(400).json({
          success: false,
          message: "Assigned user does not belong to your tenant",
        });
      }
    }

    // 3️⃣ Create task
    const taskResult = await pool.query(
      `
      INSERT INTO tasks
      (project_id, tenant_id, title, description, priority, assigned_to, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        projectId,
        tenantId,
        title,
        description,
        priority,
        assignedTo || null,
        dueDate || null,
      ]
    );

    // 4️⃣ Audit log
    await logAction({
      tenantId,
      userId,
      action: "CREATE_TASK",
      entityType: "task",
      entityId: taskResult.rows[0].id,
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      data: taskResult.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   API-17: LIST PROJECT TASKS
   GET /api/projects/:projectId/tasks
===================================================== */
exports.listTasks = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId } = req.user;
  const { status, assignedTo, priority, search } = req.query;

  try {
    let whereClause = `WHERE t.project_id = $1 AND t.tenant_id = $2`;
    const params = [projectId, tenantId];

    if (status) {
      params.push(status);
      whereClause += ` AND t.status = $${params.length}`;
    }

    if (assignedTo) {
      params.push(assignedTo);
      whereClause += ` AND t.assigned_to = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      whereClause += ` AND t.priority = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      whereClause += ` AND LOWER(t.title) LIKE $${params.length}`;
    }

    const tasksResult = await pool.query(
      `
      SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.created_at,
        u.id AS assigned_user_id,
        u.full_name AS assigned_user_name,
        u.email AS assigned_user_email
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      ${whereClause}
      ORDER BY
        CASE t.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          ELSE 3
        END,
        t.due_date ASC
      `,
      params
    );

    res.status(200).json({
      success: true,
      data: tasksResult.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   API-18: UPDATE TASK STATUS
   PATCH /api/tasks/:taskId/status
===================================================== */
exports.updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const { tenantId, userId } = req.user;

  try {
    const taskResult = await pool.query(
      `
      UPDATE tasks
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING id, status, updated_at
      `,
      [status, taskId, tenantId]
    );

    if (!taskResult.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      data: taskResult.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   API-19: UPDATE TASK
   PUT /api/tasks/:taskId
===================================================== */
exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const {
    title,
    description,
    status,
    priority,
    assignedTo,
    dueDate,
  } = req.body;
  const { tenantId, userId } = req.user;

  try {
    // Validate assigned user if provided
    if (assignedTo) {
      const userCheck = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND tenant_id = $2`,
        [assignedTo, tenantId]
      );

      if (!userCheck.rowCount) {
        return res.status(400).json({
          success: false,
          message: "Assigned user does not belong to your tenant",
        });
      }
    }

    const taskResult = await pool.query(
      `
      UPDATE tasks
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        assigned_to = $5,
        due_date = $6,
        updated_at = NOW()
      WHERE id = $7 AND tenant_id = $8
      RETURNING *
      `,
      [
        title,
        description,
        status,
        priority,
        assignedTo ?? null,
        dueDate ?? null,
        taskId,
        tenantId,
      ]
    );

    if (!taskResult.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Audit log
    await logAction({
      tenantId,
      userId,
      action: "UPDATE_TASK",
      entityType: "task",
      entityId: taskId,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: taskResult.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
