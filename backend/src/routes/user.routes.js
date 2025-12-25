const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const UserController = require("../controllers/user.controller");

// API 8: Add user to tenant
router.post(
  "/tenants/:tenantId/users",
  auth,
  authorize("tenant_admin"),
  [
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
    body("fullName").notEmpty(),
    body("role").optional().isIn(["user", "tenant_admin"])
  ],
  validate,
  UserController.createUser
);

// API 9: List tenant users
router.get(
  "/tenants/:tenantId/users",
  auth,
  UserController.listUsers
);

// API 10: Update user
router.put(
  "/users/:userId",
  auth,
  [
    body("fullName").optional(),
    body("role").optional().isIn(["user", "tenant_admin"]),
    body("isActive").optional().isBoolean()
  ],
  validate,
  UserController.updateUser
);

// API 11: Delete user
router.delete(
  "/users/:userId",
  auth,
  authorize("tenant_admin"),
  UserController.deleteUser
);

module.exports = router;
