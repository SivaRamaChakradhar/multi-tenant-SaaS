const db = require("../config/db");
const { v4: uuid } = require("uuid");

function logAction({ tenantId, userId, action, entityType, entityId, ip }) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs
    (id, tenant_id, user_id, action, entity_type, entity_id, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  stmt.run(
    uuid(),
    tenantId || null,
    userId || null,
    action,
    entityType || null,
    entityId || null,
    ip || null
  );
}

module.exports = { logAction };
