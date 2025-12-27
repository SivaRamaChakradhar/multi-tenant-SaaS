// backend/src/controllers/auth.controller.js

const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { signToken } = require("../utils/jwt");
const { logAction } = require("../services/audit.service");

/* =====================================================
   API-1: REGISTER TENANT
   POST /api/auth/register-tenant
===================================================== */
exports.registerTenant = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      tenantName,
      subdomain,
      adminEmail,
      adminPassword,
      adminFullName,
    } = req.body;

    await client.query("BEGIN");

    // 1️⃣ Create tenant
    const tenantResult = await client.query(
      `
      INSERT INTO tenants (name, subdomain)
      VALUES ($1, $2)
      RETURNING id
      `,
      [tenantName, subdomain]
    );

    const tenantId = tenantResult.rows[0].id;

    // 2️⃣ Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // 3️⃣ Create tenant admin
    const adminResult = await client.query(
      `
      INSERT INTO users
      (tenant_id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, 'tenant_admin')
      RETURNING id, email, full_name, role
      `,
      [tenantId, adminEmail, passwordHash, adminFullName]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Tenant registered successfully",
      data: {
        tenantId,
        subdomain,
        adminUser: adminResult.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    res.status(409).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
};

/* =====================================================
   API-2: LOGIN
   POST /api/auth/login
===================================================== */
exports.login = async (req, res) => {
  const { email, password, tenantSubdomain } = req.body;

  // 1️⃣ Find tenant
  const tenantResult = await pool.query(
    `SELECT * FROM tenants WHERE subdomain = $1 AND status = 'active'`,
    [tenantSubdomain]
  );

  if (!tenantResult.rowCount) {
    return res
      .status(404)
      .json({ success: false, message: "Tenant not found" });
  }

  const tenant = tenantResult.rows[0];

  // 2️⃣ Find user
  const userResult = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND tenant_id = $2`,
    [email, tenant.id]
  );

  if (!userResult.rowCount) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const user = userResult.rows[0];

  // 3️⃣ Check password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  // 4️⃣ Generate JWT
  const token = signToken({
    userId: user.id,
    tenantId: user.tenant_id,
    role: user.role,
  });

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id,
      },
      token,
      expiresIn: 86400,
    },
  });
};

/* =====================================================
   API-3: GET CURRENT USER
   GET /api/auth/me
===================================================== */
exports.me = async (req, res) => {
  const userResult = await pool.query(
    `
    SELECT
      u.id,
      u.email,
      u.full_name,
      u.role,
      u.is_active,
      t.id AS tenant_id,
      t.name,
      t.subdomain,
      t.subscription_plan,
      t.max_users,
      t.max_projects
    FROM users u
    LEFT JOIN tenants t ON t.id = u.tenant_id
    WHERE u.id = $1
    `,
    [req.user.userId]
  );

  if (!userResult.rowCount) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

 res.status(200).json({
  success: true,
  data: {
    id: userResult.rows[0].id,
    email: userResult.rows[0].email,
    fullName: userResult.rows[0].full_name,
    role: userResult.rows[0].role,
    isActive: userResult.rows[0].is_active,
    tenant: userResult.rows[0].tenant_id
      ? {
          id: userResult.rows[0].tenant_id,
          name: userResult.rows[0].name,
          subdomain: userResult.rows[0].subdomain,
          subscriptionPlan: userResult.rows[0].subscription_plan,
          maxUsers: userResult.rows[0].max_users,
          maxProjects: userResult.rows[0].max_projects,
        }
      : null,
  },
});

};

/* =====================================================
   API-4: LOGOUT
   POST /api/auth/logout
===================================================== */
exports.logout = async (req, res) => {
  await logAction({
    tenantId: req.user.tenantId,
    userId: req.user.userId,
    action: "LOGOUT",
    entityType: "session",
    entityId: null,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
