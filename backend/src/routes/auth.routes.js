const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

/*
  API-1: Register Tenant
  POST /api/auth/register-tenant
*/
router.post("/register-tenant", authController.registerTenant);

/*
  API-2: Login
  POST /api/auth/login
*/
router.post("/login", authController.login);

/*
  API-3: Get Current User
  GET /api/auth/me
*/
router.get("/me", authMiddleware, authController.me);

/*
  API-4: Logout
  POST /api/auth/logout
*/
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;
