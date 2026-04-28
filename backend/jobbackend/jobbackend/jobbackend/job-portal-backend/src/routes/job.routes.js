const express = require("express");
const router = express.Router();
const protect = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");
const jobController = require("../controllers/job.controller");
const applicationController = require("../controllers/application.controller");
const {
  validateJobPayload,
  validateObjectIdParam,
  validateApplyJob,
} = require("../middlewares/validation.middleware");

router.post("/", protect, authorizeRoles("admin"), validateJobPayload, jobController.createJob);
router.put("/:id", protect, authorizeRoles("admin"), validateObjectIdParam("id"), validateJobPayload, jobController.updateJob);
router.delete("/:id", protect, authorizeRoles("admin"), validateObjectIdParam("id"), jobController.deleteJob);

router.get("/", jobController.getJobs);
// Same handler as POST /api/applications/apply — persist application + Nodemailer to user's email
router.post("/apply", protect, validateApplyJob, applicationController.applyJob);

module.exports = router;
