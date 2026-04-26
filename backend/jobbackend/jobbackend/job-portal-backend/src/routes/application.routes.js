const express = require("express");
const router = express.Router();
const protect = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");
const appController = require("../controllers/application.controller");
const {
  validateApplyJob,
  validateApplicationUpdate,
  validateApplicationStatus,
  validateObjectIdParam,
} = require("../middlewares/validation.middleware");

router.post("/apply", protect, validateApplyJob, appController.applyJob);
router.get("/my", protect, appController.getMyApplications);
router.put("/:id", protect, validateObjectIdParam("id"), validateApplicationUpdate, appController.updateApplication);
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  validateObjectIdParam("id"),
  validateApplicationStatus,
  appController.updateApplicationStatus
);
router.delete("/:id", protect, validateObjectIdParam("id"), appController.deleteApplication);

module.exports = router;
