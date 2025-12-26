const pool = require("../src/config/db");
const bcrypt = require("bcrypt");

(async () => {
  try {
    console.log("🌱 Seeding database...");

    // ---- SUPER ADMIN ----
    const superAdminHash = await bcrypt.hash("Admin@123", 10);

    const superAdmin = await pool.query(
      `
      INSERT INTO users (email,password_hash,full_name,role,tenant_id)
      VALUES ($1,$2,$3,'super_admin',NULL)
      ON CONFLICT DO NOTHING
      RETURNING id
      `,
      ["superadmin@system.com", superAdminHash, "System Admin"]
    );

    // ---- TENANT ----
    const tenant = await pool.query(
      `
      INSERT INTO tenants
      (name,subdomain,status,subscription_plan,max_users,max_projects)
      VALUES ('Demo Company','demo','active','pro',25,15)
      RETURNING id
      `
    );

    const tenantId = tenant.rows[0].id;

    // ---- TENANT ADMIN ----
    const adminHash = await bcrypt.hash("Demo@123", 10);
    const admin = await pool.query(
      `
      INSERT INTO users
      (tenant_id,email,password_hash,full_name,role)
      VALUES ($1,$2,$3,$4,'tenant_admin')
      RETURNING id
      `,
      [tenantId, "admin@demo.com", adminHash, "Demo Admin"]
    );

    // ---- USERS ----
    const userHash = await bcrypt.hash("User@123", 10);

    const user1 = await pool.query(
      `
      INSERT INTO users
      (tenant_id,email,password_hash,full_name,role)
      VALUES ($1,$2,$3,$4,'user')
      RETURNING id
      `,
      [tenantId, "user1@demo.com", userHash, "Demo User One"]
    );

    const user2 = await pool.query(
      `
      INSERT INTO users
      (tenant_id,email,password_hash,full_name,role)
      VALUES ($1,$2,$3,$4,'user')
      RETURNING id
      `,
      [tenantId, "user2@demo.com", userHash, "Demo User Two"]
    );

    // ---- PROJECTS ----
    const project1 = await pool.query(
      `
      INSERT INTO projects
      (tenant_id,name,description,created_by)
      VALUES ($1,'Project Alpha','First demo project',$2)
      RETURNING id
      `,
      [tenantId, admin.rows[0].id]
    );

    const project2 = await pool.query(
      `
      INSERT INTO projects
      (tenant_id,name,description,created_by)
      VALUES ($1,'Project Beta','Second demo project',$2)
      RETURNING id
      `,
      [tenantId, admin.rows[0].id]
    );

    // ---- TASKS ----
    await pool.query(
      `
      INSERT INTO tasks
      (project_id,tenant_id,title,priority,assigned_to)
      VALUES
      ($1,$2,'Design UI','high',$3),
      ($1,$2,'Create API','medium',$4),
      ($2,$2,'Write Docs','low',$3)
      `,
      [
        project1.rows[0].id,
        tenantId,
        user1.rows[0].id,
        user2.rows[0].id,
      ]
    );

    console.log("✅ Seeding complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed", err);
    process.exit(1);
  }
})();
