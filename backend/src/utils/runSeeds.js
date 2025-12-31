const pool = require("../config/db");

async function runSeeds() {
  console.log("🌱 Running seed data...");

  // Prevent duplicate seeding
  const existing = await pool.query("SELECT COUNT(*) FROM users");
  if (Number(existing.rows[0].count) > 0) {
    console.log("⚠️ Seed data already exists, skipping");
    return;
  }

  // Pre-hashed passwords using bcrypt with 10 rounds
  // These are hashes for: Admin@123, Demo@123, User@123
  const superHash = "$2b$10$TLTTkmQ4NMuKY2CZFF8ANe1QbepxyThFbPKdZTG0FTASj3aEWKfRW";
  const adminHash = "$2b$10$ZXQLkfm2cn8PMwQR6dEgPOE33trd5LfGtw6P4VdjtrsrAazIEZVsS";
  const userHash = "$2b$10$pScK3COrOphGclHsD5cA0ej86GNlawHKJMBo2hrIEDR6YbEpH1CFm";

  // 1️⃣ Create tenant
  const tenant = await pool.query(
    `
    INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
    VALUES ('Demo Company', 'demo', 'active', 'pro', 25, 15)
    RETURNING id
    `
  );

  const tenantId = tenant.rows[0].id;

  // 2️⃣ Create super admin (tenant_id = NULL)
  await pool.query(
    `
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES ('superadmin@system.com', $1, 'Super Admin', 'super_admin')
    `,
    [superHash]
  );

  // 3️⃣ Tenant admin
  const admin = await pool.query(
    `
    INSERT INTO users (tenant_id, email, password_hash, full_name, role)
    VALUES ($1, 'admin@demo.com', $2, 'Demo Admin', 'tenant_admin')
    RETURNING id
    `,
    [tenantId, adminHash]
  );

  // 4️⃣ Regular user
  await pool.query(
    `
    INSERT INTO users (tenant_id, email, password_hash, full_name, role)
    VALUES ($1, 'user1@demo.com', $2, 'Demo User', 'user')
    `,
    [tenantId, userHash]
  );

  // 5️⃣ Sample project
  await pool.query(
    `
    INSERT INTO projects (tenant_id, name, description, created_by)
    VALUES ($1, 'Project Alpha', 'First demo project', $2)
    `,
    [tenantId, admin.rows[0].id]
  );

  console.log("✅ Seed data inserted successfully");
}

module.exports = runSeeds;
