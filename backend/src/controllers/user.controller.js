const db = require("../config/db");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
const { logAction } = require("../services/audit");


class UserController {

  // --------------------------------------------------
  // API 8: ADD USER TO TENANT
  // --------------------------------------------------
  static async createUser(req, res) {
    const { tenantId } = req.params;
    const { userId: currentUser, tenantId: currentTenant } = req.user;

    if (tenantId !== currentTenant) {
      return res.status(403).json({
        success: false,
        message: "Cannot add user to another tenant"
      });
    }

    const { email, password, fullName, role = "user" } = req.body;

    const tenant = db.prepare(`
      SELECT * FROM tenants WHERE id=?
    `).get(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    // Check subscription limit
    const count = db.prepare(`
      SELECT COUNT(*) AS total FROM users WHERE tenant_id=?
    `).get(tenantId).total;

    if (count >= tenant.max_users) {
      return res.status(403).json({
        success: false,
        message: "Subscription user limit reached"
      });
    }

    // Check duplicate email in same tenant
    const existing = db.prepare(`
      SELECT 1 FROM users WHERE tenant_id=? AND email=?
    `).get(tenantId, email);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already exists in this tenant"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUserId = uuid();

    db.prepare(`
      INSERT INTO users (id,tenant_id,email,password_hash,full_name,role,is_active,created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).run(newUserId, tenantId, email, passwordHash, fullName, role);

    logAction({
      tenantId,
      userId: currentUser,
      action: "CREATE_USER",
      entityType: "user",
      entityId: newUserId
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: newUserId,
        email,
        fullName,
        role,
        tenantId,
        isActive: true
      }
    });
  }


  // --------------------------------------------------
  // API 9: LIST TENANT USERS
  // --------------------------------------------------
  static listUsers(req, res) {
    const { tenantId } = req.params;
    const { role, tenantId: myTenant } = req.user;

    if (role !== "super_admin" && tenantId !== myTenant) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view users"
      });
    }

    const search = req.query.search || "";
    const roleFilter = req.query.role || null;

    const users = db.prepare(`
      SELECT id,email,full_name,role,is_active,created_at
      FROM users
      WHERE tenant_id=?
        AND (full_name LIKE ? OR email LIKE ?)
        AND (role = ? OR ? IS NULL)
      ORDER BY created_at DESC
    `).all(
      tenantId,
      `%${search}%`,
      `%${search}%`,
      roleFilter,
      roleFilter
    );

    return res.json({
      success: true,
      data: {
        users,
        total: users.length
      }
    });
  }


  // --------------------------------------------------
  // API 10: UPDATE USER
  // --------------------------------------------------
  static updateUser(req, res) {
    const { userId } = req.params;
    const { role, userId: currentUserId, tenantId } = req.user;

    const user = db.prepare(`
      SELECT * FROM users WHERE id=?
    `).get(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (role !== "super_admin" && user.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this user"
      });
    }

    const { fullName, role: newRole, isActive } = req.body;

    // Self-update restriction
    if (currentUserId === userId && newRole && newRole !== user.role) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role"
      });
    }

    // normal user can only change own full name
    if (role === "user" && currentUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile"
      });
    }

    // apply update
    db.prepare(`
      UPDATE users
      SET
        full_name = COALESCE(?, full_name),
        role = COALESCE(?, role),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id=?
    `).run(fullName, newRole, isActive, userId);

    logAction({
      tenantId: user.tenant_id,
      userId: currentUserId,
      action: "UPDATE_USER",
      entityType: "user",
      entityId: userId
    });

    return res.json({
      success: true,
      message: "User updated successfully",
      data: { id: userId }
    });
  }


  // --------------------------------------------------
  // API 11: DELETE USER
  // --------------------------------------------------
  static deleteUser(req, res) {
    const { userId } = req.params;
    const { userId: currentUserId, tenantId } = req.user;

    if (userId === currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Tenant admin cannot delete themselves"
      });
    }

    const user = db.prepare(`
      SELECT * FROM users WHERE id=?
    `).get(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete user from another tenant"
      });
    }

    // unassign tasks instead of breaking FK
    db.prepare(`
      UPDATE tasks SET assigned_to=NULL WHERE assigned_to=?
    `).run(userId);

    db.prepare(`
      DELETE FROM users WHERE id=?
    `).run(userId);

    logAction({
      tenantId,
      userId: currentUserId,
      action: "DELETE_USER",
      entityType: "user",
      entityId: userId
    });

    return res.json({
      success: true,
      message: "User deleted successfully"
    });
  }
}

module.exports = UserController;
