const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const { logAction } = require("../services/audit");

const plans = {
  free: { max_users: 5, max_projects: 3 },
  pro: { max_users: 25, max_projects: 15 },
  enterprise: { max_users: 100, max_projects: 50 }
};

class AuthController {

  // --------------------------------------------------
  // API 1: REGISTER TENANT
  // --------------------------------------------------
  static async registerTenant(req, res, next) {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    const tenantId = uuid();
    const adminId = uuid();

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    try {
      db.exec("BEGIN TRANSACTION");

      const exists = db.prepare(`
        SELECT 1 FROM tenants WHERE subdomain=?
      `).get(subdomain);

      if (exists) {
        db.exec("ROLLBACK");
        return res.status(409).json({
          success: false,
          message: "Subdomain already exists"
        });
      }

      const plan = plans.free;

      db.prepare(`
        INSERT INTO tenants (id,name,subdomain,status,subscription_plan,max_users,max_projects,created_at,updated_at)
        VALUES (?, ?, ?, 'active', 'free', ?, ?, datetime('now'), datetime('now'))
      `).run(tenantId, tenantName, subdomain, plan.max_users, plan.max_projects);

      db.prepare(`
        INSERT INTO users (id,tenant_id,email,password_hash,full_name,role,is_active,created_at)
        VALUES (?, ?, ?, ?, ?, 'tenant_admin', 1, datetime('now'))
      `).run(adminId, tenantId, adminEmail, passwordHash, adminFullName);

      db.exec("COMMIT");

      return res.status(201).json({
        success: true,
        message: "Tenant registered successfully",
        data: {
          tenantId,
          subdomain,
          adminUser: {
            id: adminId,
            email: adminEmail,
            fullName: adminFullName,
            role: "tenant_admin"
          }
        }
      });

    } catch (err) {
      db.exec("ROLLBACK");
      next(err);
    }
  }


// --------------------------------------------------
// API 2: LOGIN
// --------------------------------------------------
static async login(req, res, next) {
  const { email, password, tenantSubdomain } = req.body;

  try {
    let user = null;
    let tenant = null;

    // -------- SUPER ADMIN LOGIN (NO TENANT REQUIRED) --------
    if (email === "superadmin@system.com") {
      user = db
        .prepare(`SELECT * FROM users WHERE email=? AND role='super_admin'`)
        .get(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }
    }

    // -------- NORMAL TENANT USER LOGIN --------
    else {
      if (!tenantSubdomain) {
        return res.status(400).json({
          success: false,
          message: "Tenant subdomain is required"
        });
      }

      tenant = db
        .prepare(`SELECT * FROM tenants WHERE subdomain=?`)
        .get(tenantSubdomain);

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: "Tenant not found"
        });
      }

      if (tenant.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Tenant is not active"
        });
      }

      user = db
        .prepare(
          `SELECT * FROM users WHERE email=? AND tenant_id=?`
        )
        .get(email, tenant.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }
    }

    // -------- PASSWORD CHECK --------
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }


    // -------- JWT --------
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id || null,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("JWT_SECRET:", process.env.JWT_SECRET);

    logAction({
      tenantId: user.tenant_id || null,
      userId: user.id,
      action: "LOGIN",
      entityType: "user",
      entityId: user.id,
      ip: req.ip
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id
        },
        token,
        expiresIn: 86400
      }
    });

  } catch (err) {
    next(err);
  }
}
  // --------------------------------------------------
  // API 3: GET CURRENT USER
  // --------------------------------------------------
  static async me(req, res, next) {
    try {
      const user = db
        .prepare(
          `
          SELECT u.id, u.email, u.full_name, u.role, u.is_active,
                 t.id as tenant_id, t.name as tenant_name, t.subdomain,
                 t.subscription_plan, t.max_users, t.max_projects
          FROM users u
          LEFT JOIN tenants t ON u.tenant_id = t.id
          WHERE u.id=?
        `
        )
        .get(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      return res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isActive: !!user.is_active,
          tenant: user.tenant_id
            ? {
                id: user.tenant_id,
                name: user.tenant_name,
                subdomain: user.subdomain,
                subscriptionPlan: user.subscription_plan,
                maxUsers: user.max_users,
                maxProjects: user.max_projects
              }
            : null
        }
      });
    } catch (err) {
      next(err);
    }
  }



  // --------------------------------------------------
  // API 4: LOGOUT
  // --------------------------------------------------
  static async logout(req, res) {
    logAction({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      action: "LOGOUT",
      entityType: "user",
      entityId: req.user.userId,
      ip: req.ip
    });

    return res.json({
      success: true,
      message: "Logged out successfully"
    });
  }
}

module.exports = AuthController;
