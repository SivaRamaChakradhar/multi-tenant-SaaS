require("dotenv").config();
const express = require("express");
const cors = require("cors");

const init = require("./utils/init");

// routes
const authRoutes = require("./routes/auth.routes");
const tenantRoutes = require("./routes/tenant.routes");
const userRoutes = require("./routes/user.routes");
const projectRoutes = require("./routes/project.routes");
const taskRoutes = require("./routes/task.routes");

async function start() {
  // 1️⃣ DB migrations + seeds
  console.log("Running migrations & seeds...");
  try {
    await init();
  } catch (err) {
    console.error("INIT FAILED:", err.message);
  }
  console.log("DB ready");

  const app = express();

  // 2️⃣ Middleware
  app.use(express.json());

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    })
  );

  // 3️⃣ Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  });

  // 4️⃣ Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/tenants", tenantRoutes);
  app.use("/api", userRoutes);
  app.use("/api", projectRoutes);
  app.use("/api", taskRoutes);

  // 5️⃣ Error Handling
  app.use((err, req, res, next) => {
    console.error("API Error:", err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error"
    });
  });

  return app;
}

module.exports = start;
