const migrations = [require("../migrations/001_create_tables")];
const seed = require("../seeds/seed");

async function init() {
  for (let migration of migrations) migration.up();
  await seed();
}

module.exports = init;
