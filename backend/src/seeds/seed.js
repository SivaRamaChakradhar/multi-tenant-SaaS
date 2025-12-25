const db = require("../config/db");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");

async function seed() {
  // SUPER ADMIN
  const superAdminHash = await bcrypt.hash("Admin@123", 10);

  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, tenant_id, created_at)
    VALUES (?, ?, ?, ?, 'super_admin', NULL, datetime('now'))
  `).run(uuid(), "superadmin@system.com", superAdminHash, "System Admin");

  // CHECK IF TENANT EXISTS
  let tenant = db
    .prepare(`SELECT * FROM tenants WHERE subdomain=?`)
    .get("demo");

  let tenantId;

  if (!tenant) {
    tenantId = uuid();

    db.prepare(`
      INSERT INTO tenants (id,name,subdomain,status,subscription_plan,max_users,max_projects,created_at)
      VALUES (?, 'Demo Company', 'demo', 'active', 'pro', 25, 15, datetime('now'))
    `).run(tenantId);
  } else {
    tenantId = tenant.id;
  }

  // TENANT ADMIN
  const adminHash = await bcrypt.hash("Demo@123", 10);

  db.prepare(`
    INSERT OR IGNORE INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, created_at)
    VALUES (?, ?, ?, ?, 'Demo Admin', 'tenant_admin', 1, datetime('now'))
  `).run(uuid(), tenantId, "admin@demo.com", adminHash);

  return true;
}

module.exports = seed;