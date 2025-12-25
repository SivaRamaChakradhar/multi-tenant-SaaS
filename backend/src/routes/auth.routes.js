const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

// Public
router.post("/register-tenant", AuthController.registerTenant);
router.post("/login", AuthController.login);

// Protected
router.get("/me", auth, AuthController.me);
router.post("/logout", auth, AuthController.logout);

console.log("Loaded auth middleware from:", require.resolve("../middleware/auth"));


module.exports = router;
