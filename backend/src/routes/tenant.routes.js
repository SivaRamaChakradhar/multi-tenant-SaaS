const express = require("express");
const router = express.Router();

const tenantController = require("../controllers/tenant.controller");
const authMiddleware = require("../middleware/auth.middleware");

/*
  API-5: Get Tenant Details
  GET /api/tenants/:tenantId
*/
router.get(
  "/:tenantId",
  authMiddleware,
  tenantController.getTenant
);

/*
  API-6: Update Tenant
  PUT /api/tenants/:tenantId
*/
router.put(
  "/:tenantId",
  authMiddleware,
  tenantController.updateTenant
);

/*
  API-7: List All Tenants (Super Admin)
  GET /api/tenants
*/
router.get(
  "/",
  authMiddleware,
  tenantController.listTenants
);

module.exports = router;
