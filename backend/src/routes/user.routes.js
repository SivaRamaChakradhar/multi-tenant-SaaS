const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");

/*
  API-8: Add User to Tenant
  POST /api/tenants/:tenantId/users
*/
router.post(
  "/tenants/:tenantId/users",
  authMiddleware,
  userController.addUser
);

/*
  API-9: List Tenant Users
  GET /api/tenants/:tenantId/users
*/
router.get(
  "/tenants/:tenantId/users",
  authMiddleware,
  userController.listUsers
);

/*
  API-10: Update User
  PUT /api/users/:userId
*/
router.put(
  "/users/:userId",
  authMiddleware,
  userController.updateUser
);

/*
  API-11: Delete User
  DELETE /api/users/:userId
*/
router.delete(
  "/users/:userId",
  authMiddleware,
  userController.deleteUser
);

module.exports = router;
