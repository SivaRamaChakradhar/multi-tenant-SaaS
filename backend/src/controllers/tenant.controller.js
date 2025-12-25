const db = require("../config/db");
const { logAction } = require("../services/audit");

class TenantController {
  // --------------------------------------------------
  // API 5: GET TENANT DETAILS
  // --------------------------------------------------
  static getTenant(req, res) {
    const { tenantId } = req.params;
    const { role, tenantId: userTenant } = req.user;

    // Tenant users can see ONLY their own tenant
    if (role !== "super_admin" && userTenant !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this tenant"
      });
    }

    const tenant = db.prepare(`
      SELECT t.*,
        (SELECT COUNT(*) FROM users WHERE tenant_id=t.id) AS totalUsers,
        (SELECT COUNT(*) FROM projects WHERE tenant_id=t.id) AS totalProjects,
        (SELECT COUNT(*) FROM tasks WHERE tenant_id=t.id) AS totalTasks
      FROM tenants t
      WHERE t.id=?
    `).get(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    return res.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        subscriptionPlan: tenant.subscription_plan,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        createdAt: tenant.created_at,
        stats: {
          totalUsers: tenant.totalUsers,
          totalProjects: tenant.totalProjects,
          totalTasks: tenant.totalTasks
        }
      }
    });
  }

  // --------------------------------------------------
  // API 6: UPDATE TENANT
  // --------------------------------------------------
  static updateTenant(req, res) {
    const { tenantId } = req.params;
    const { role, tenantId: userTenant, userId } = req.user;

    const updates = req.body;

    const tenant = db.prepare(`SELECT * FROM tenants WHERE id=?`).get(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    // Tenant admin can update ONLY name
    if (role === "tenant_admin") {
      if (tenantId !== userTenant) {
        return res.status(403).json({
          success: false,
          message: "Cannot update another tenant"
        });
      }

      if (Object.keys(updates).some(f => f !== "name")) {
        return res.status(403).json({
          success: false,
          message: "Tenant admin cannot update subscription fields"
        });
      }

      db.prepare(`
        UPDATE tenants SET name=?, updated_at=datetime('now') WHERE id=?
      `).run(updates.name, tenantId);

    } else if (role === "super_admin") {
      // Super admin can update everything
      db.prepare(`
        UPDATE tenants
        SET
          name = COALESCE(?, name),
          status = COALESCE(?, status),
          subscription_plan = COALESCE(?, subscription_plan),
          max_users = COALESCE(?, max_users),
          max_projects = COALESCE(?, max_projects),
          updated_at = datetime('now')
        WHERE id=?
      `).run(
        updates.name,
        updates.status,
        updates.subscriptionPlan,
        updates.maxUsers,
        updates.maxProjects,
        tenantId
      );

    } else {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    logAction({
      tenantId,
      userId,
      action: "UPDATE_TENANT",
      entityType: "tenant",
      entityId: tenantId,
      ip: null
    });

    return res.json({
      success: true,
      message: "Tenant updated successfully",
      data: { id: tenantId }
    });
  }

  // --------------------------------------------------
  // API 7: LIST ALL TENANTS (SUPER ADMIN ONLY)
  // --------------------------------------------------
  static listTenants(req, res) {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const status = req.query.status || null;
    const plan = req.query.subscriptionPlan || null;

    const tenants = db.prepare(`
      SELECT t.*,
        (SELECT COUNT(*) FROM users WHERE tenant_id=t.id) AS totalUsers,
        (SELECT COUNT(*) FROM projects WHERE tenant_id=t.id) AS totalProjects
      FROM tenants t
      WHERE (t.status = ? OR ? IS NULL)
        AND (t.subscription_plan = ? OR ? IS NULL)
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(status, status, plan, plan, limit, offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM tenants
      WHERE (status = ? OR ? IS NULL)
        AND (subscription_plan = ? OR ? IS NULL)
    `).get(status, status, plan, plan).count;

    return res.json({
      success: true,
      data: {
        tenants: tenants.map(t => ({
          id: t.id,
          name: t.name,
          subdomain: t.subdomain,
          status: t.status,
          subscriptionPlan: t.subscription_plan,
          totalUsers: t.totalUsers,
          totalProjects: t.totalProjects,
          createdAt: t.created_at
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalTenants: total,
          limit
        }
      }
    });
  }
}

module.exports = TenantController;
