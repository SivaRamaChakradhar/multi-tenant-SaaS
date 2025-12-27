// backend/src/controllers/tenant.controller.js

const pool = require("../config/db");
const { logAction } = require("../services/audit.service");

/* =====================================================
   API-5: GET TENANT DETAILS
   GET /api/tenants/:tenantId
===================================================== */
exports.getTenant = async (req, res) => {
  const { tenantId: paramTenantId } = req.params;
  const { tenantId, role } = req.user;

  // Authorization: own tenant OR super_admin
  if (role !== "super_admin" && tenantId !== paramTenantId) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized access to tenant",
    });
  }

  try {
    const tenantResult = await pool.query(
      `
      SELECT
        t.id,
        t.name,
        t.subdomain,
        t.status,
        t.subscription_plan,
        t.max_users,
        t.max_projects,
        t.created_at
      FROM tenants t
      WHERE t.id = $1
      `,
      [paramTenantId]
    );

    if (!tenantResult.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Stats
    const statsResult = await pool.query(
      `
      SELECT
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) AS total_users,
        (SELECT COUNT(*) FROM projects WHERE tenant_id = $1) AS total_projects,
        (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1) AS total_tasks
      `,
      [paramTenantId]
    );

    res.status(200).json({
      success: true,
      data: {
        ...tenantResult.rows[0],
        stats: statsResult.rows[0],
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
   API-6: UPDATE TENANT
   PUT /api/tenants/:tenantId
===================================================== */
exports.updateTenant = async (req, res) => {
  const { tenantId: paramTenantId } = req.params;
  const { tenantId, role, userId } = req.user;
  const {
    name,
    status,
    subscriptionPlan,
    maxUsers,
    maxProjects,
  } = req.body;

  // tenant_admin can only update name
  if (role === "tenant_admin" && tenantId !== paramTenantId) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (role === "tenant_admin" && (status || subscriptionPlan || maxUsers || maxProjects)) {
    return res.status(403).json({
      success: false,
      message: "Tenant admin cannot update subscription fields",
    });
  }

  try {
    const updatedTenant = await pool.query(
      `
      UPDATE tenants
      SET
        name = COALESCE($1, name),
        status = COALESCE($2, status),
        subscription_plan = COALESCE($3, subscription_plan),
        max_users = COALESCE($4, max_users),
        max_projects = COALESCE($5, max_projects),
        updated_at = NOW()
      WHERE id = $6
      RETURNING id, name, status, subscription_plan, max_users, max_projects
      `,
      [
        name,
        role === "super_admin" ? status : null,
        role === "super_admin" ? subscriptionPlan : null,
        role === "super_admin" ? maxUsers : null,
        role === "super_admin" ? maxProjects : null,
        paramTenantId,
      ]
    );

    if (!updatedTenant.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    await logAction({
      tenantId: paramTenantId,
      userId,
      action: "UPDATE_TENANT",
      entityType: "tenant",
      entityId: paramTenantId,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Tenant updated successfully",
      data: updatedTenant.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   API-7: LIST ALL TENANTS (SUPER ADMIN)
   GET /api/tenants
===================================================== */
exports.listTenants = async (req, res) => {
  const { role } = req.user;

  if (role !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Super admin access only",
    });
  }

  try {
    const tenantsResult = await pool.query(
      `
      SELECT
        t.id,
        t.name,
        t.subdomain,
        t.status,
        t.subscription_plan,
        t.created_at,
        (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) AS total_users,
        (SELECT COUNT(*) FROM projects p WHERE p.tenant_id = t.id) AS total_projects
      FROM tenants t
      ORDER BY t.created_at DESC
      `
    );

    res.status(200).json({
      success: true,
      data: {
        tenants: tenantsResult.rows,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
