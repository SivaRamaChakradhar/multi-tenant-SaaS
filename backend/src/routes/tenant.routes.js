const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const TenantController = require("../controllers/tenant.controller");

// API 5: Get Tenant Details
router.get("/:tenantId", auth, TenantController.getTenant);

// API 6: Update Tenant
router.put(
  "/:tenantId",
  auth,
  [
    body("name").optional().isString(),
    body("status").optional(),
    body("subscriptionPlan").optional(),
    body("maxUsers").optional().isNumeric(),
    body("maxProjects").optional().isNumeric()
  ],
  validate,
  TenantController.updateTenant
);

// API 7: List All Tenants (super admin only)
router.get("/", auth, authorize("super_admin"), TenantController.listTenants);

module.exports = router;
