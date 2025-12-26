require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");
const runMigrations = require("./utils/runMigrations");
const runSeeds = require("./utils/runSeeds");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database connected");

    await runMigrations(); // 🔥 THIS FIXES EVERYTHING

    await runSeeds();

    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

startServer();
