const db = require("../config/db");
const { v4: uuid } = require("uuid");
const { logAction } = require("../services/audit");

class TaskController {

  // --------------------------------------------------
  // API 16: CREATE TASK
  // --------------------------------------------------
  static createTask(req, res) {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority = "medium", dueDate } = req.body;
    const { userId } = req.user;

    // Get project + tenant
    const project = db.prepare(
      `SELECT * FROM projects WHERE id=?`
    ).get(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const tenantId = project.tenant_id;

    // Validate assigned user belongs to tenant
    if (assignedTo) {
      const validUser = db.prepare(
        `SELECT 1 FROM users WHERE id=? AND tenant_id=?`
      ).get(assignedTo, tenantId);

      if (!validUser) {
        return res.status(400).json({
          success: false,
          message: "Assigned user does not belong to this tenant"
        });
      }
    }

    const id = uuid();

    db.prepare(
      `
      INSERT INTO tasks
      (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at)
      VALUES (?, ?, ?, ?, ?, 'todo', ?, ?, ?, datetime('now'))
    `
    ).run(id, projectId, tenantId, title, description || null, priority, assignedTo || null, dueDate || null);

    logAction({
      tenantId,
      userId,
      action: "CREATE_TASK",
      entityType: "task",
      entityId: id
    });

    return res.status(201).json({
      success: true,
      data: {
        id,
        projectId,
        tenantId,
        title,
        priority
      }
    });
  }

  // --------------------------------------------------
  // API 17: LIST TASKS
  // --------------------------------------------------
  static listTasks(req, res) {
    const { projectId } = req.params;
    const { status, assignedTo, priority, search = "" } = req.query;
    const { tenantId } = req.user;

    const project = db.prepare(
      `SELECT tenant_id FROM projects WHERE id=?`
    ).get(projectId);

    if (!project || project.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    const tasks = db.prepare(
      `
      SELECT t.*, u.full_name, u.email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id=?
        AND (t.status = ? OR ? IS NULL)
        AND (t.assigned_to = ? OR ? IS NULL)
        AND (t.priority = ? OR ? IS NULL)
        AND (t.title LIKE ?)
      ORDER BY
        CASE t.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          ELSE 3
        END,
        t.due_date ASC
    `
    ).all(
      projectId,
      status, status,
      assignedTo, assignedTo,
      priority, priority,
      `%${search}%`
    );

    return res.json({
      success: true,
      data: {
        tasks,
        total: tasks.length
      }
    });
  }

  // --------------------------------------------------
  // API 18: UPDATE TASK STATUS
  // --------------------------------------------------
  static updateStatus(req, res) {
    const { taskId } = req.params;
    const { status } = req.body;
    const { tenantId } = req.user;

    const task = db.prepare(
      `SELECT * FROM tasks WHERE id=?`
    ).get(taskId);

    if (!task || task.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized or task not found"
      });
    }

    db.prepare(
      `
      UPDATE tasks
      SET status=?, updated_at=datetime('now')
      WHERE id=?
    `
    ).run(status, taskId);

    return res.json({
      success: true,
      data: { id: taskId, status }
    });
  }

  // --------------------------------------------------
  // API 19: UPDATE FULL TASK
  // --------------------------------------------------
  static updateTask(req, res) {
    const { taskId } = req.params;
    const { tenantId } = req.user;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    const task = db.prepare(
      `SELECT * FROM tasks WHERE id=?`
    ).get(taskId);

    if (!task || task.tenant_id !== tenantId) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // validate assigned user
    if (assignedTo) {
      const exists = db.prepare(
        `SELECT 1 FROM users WHERE id=? AND tenant_id=?`
      ).get(assignedTo, tenantId);

      if (!exists) {
        return res.status(400).json({
          success: false,
          message: "Assigned user not in same tenant"
        });
      }
    }

    db.prepare(
      `
      UPDATE tasks
      SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        assigned_to = ?,
        due_date = ?,
        updated_at = datetime('now')
      WHERE id=?
    `
    ).run(
      title,
      description,
      status,
      priority,
      assignedTo || null,
      dueDate || null,
      taskId
    );

    logAction({
      tenantId,
      userId: req.user.userId,
      action: "UPDATE_TASK",
      entityType: "task",
      entityId: taskId
    });

    return res.json({
      success: true,
      message: "Task updated successfully"
    });
  }
}

module.exports = TaskController;
