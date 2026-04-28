const express = require("express");
const router = express.Router();
const protect = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/role.middleware");
const testController = require("../controllers/test.controller");
const {
  validateCreateTest,
  validateUpdateTest,
  validateSubmitTest,
  validateObjectIdParam,
} = require("../middlewares/validation.middleware");

router.post("/", protect, authorizeRoles("admin"), validateCreateTest, testController.createTest);
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  validateObjectIdParam("id"),
  validateUpdateTest,
  testController.updateTest
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  validateObjectIdParam("id"),
  testController.deleteTest
);
router.get("/job/:jobId", protect, validateObjectIdParam("jobId"), testController.getTestByJob);
router.post("/submit", protect, validateSubmitTest, testController.submitTest);

module.exports = router;
