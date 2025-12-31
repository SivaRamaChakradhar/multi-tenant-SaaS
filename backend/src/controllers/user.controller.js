// backend/src/controllers/user.controller.js

const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { logAction } = require("../services/audit.service");

/* =====================================================
   API-8: ADD USER TO TENANT
   POST /api/tenants/:tenantId/users
===================================================== */
exports.addUser = async (req, res) => {
  const { tenantId: paramTenantId } = req.params;
  const { tenantId, role, userId } = req.user;
  const { email, password, fullName, role: newRole = "user" } = req.body;

  // Check: must be tenant_admin and tenantId must match (both are UUIDs)
  if (role !== "tenant_admin" || tenantId !== paramTenantId) {
    return res.status(403).json({
      success: false,
      message: "Only tenant admin can add users",
    });
  }

  console.log('✅ ADD USER - Validation passed, creating user...');

  try {
    // Subscription limit check
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE tenant_id = $1`,
      [tenantId]
    );

    const tenantResult = await pool.query(
      `SELECT max_users FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (+countResult.rows[0].count >= tenantResult.rows[0].max_users) {
      return res.status(403).json({
        success: false,
        message: "User limit reached for this subscription plan",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `
      INSERT INTO users
      (tenant_id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, full_name, role, is_active, created_at
      `,
      [tenantId, email, passwordHash, fullName, newRole]
    );

    await logAction({
      tenantId,
      userId,
      action: "CREATE_USER",
      entityType: "user",
      entityId: userResult.rows[0].id,
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userResult.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email already exists in this tenant",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   API-9: LIST TENANT USERS
   GET /api/tenants/:tenantId/users
===================================================== */
exports.listUsers = async (req, res) => {
  const { tenantId: paramTenantId } = req.params;
  const { tenantId } = req.user;

  if (tenantId !== paramTenantId) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized access",
    });
  }

  try {
    const usersResult = await pool.query(
      `
      SELECT
        id,
        email,
        full_name,
        role,
        is_active,
        created_at
      FROM users
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      `,
      [tenantId]
    );

    res.status(200).json({
      success: true,
      data: {
        users: usersResult.rows,
        total: usersResult.rowCount,
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
   API-10: UPDATE USER
   PUT /api/users/:userId
===================================================== */
exports.updateUser = async (req, res) => {
  const { userId: targetUserId } = req.params;
  const { userId, tenantId, role } = req.user;
  const { fullName, role: newRole, isActive } = req.body;

  try {
    const targetUser = await pool.query(
      `SELECT * FROM users WHERE id = $1 AND tenant_id = $2`,
      [targetUserId, tenantId]
    );

    if (!targetUser.rowCount) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Authorization
    if (userId !== targetUserId && role !== "tenant_admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this user",
      });
    }

    // Only tenant_admin can update role & is_active
    if (role !== "tenant_admin" && (newRole || isActive !== undefined)) {
      return res.status(403).json({
        success: false,
        message: "Only tenant admin can update role or status",
      });
    }

    const updatedUser = await pool.query(
      `
      UPDATE users
      SET
        full_name = COALESCE($1, full_name),
        role = COALESCE($2, role),
        is_active = COALESCE($3, is_active),
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, email, full_name, role, is_active
      `,
      [
        fullName,
        role === "tenant_admin" ? newRole : null,
        role === "tenant_admin" ? isActive : null,
        targetUserId,
      ]
    );

    await logAction({
      tenantId,
      userId,
      action: "UPDATE_USER",
      entityType: "user",
      entityId: targetUserId,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   API-11: DELETE USER
   DELETE /api/users/:userId
===================================================== */
exports.deleteUser = async (req, res) => {
  const { userId: targetUserId } = req.params;
  const { userId, tenantId, role } = req.user;

  if (role !== "tenant_admin") {
    return res.status(403).json({
      success: false,
      message: "Only tenant admin can delete users",
    });
  }

  if (userId === targetUserId) {
    return res.status(403).json({
      success: false,
      message: "Tenant admin cannot delete themselves",
    });
  }

  try {
    const deleteResult = await pool.query(
      `DELETE FROM users WHERE id = $1 AND tenant_id = $2`,
      [targetUserId, tenantId]
    );

    if (!deleteResult.rowCount) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await logAction({
      tenantId,
      userId,
      action: "DELETE_USER",
      entityType: "user",
      entityId: targetUserId,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
