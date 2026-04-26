const express = require("express");
const router = express.Router();
const protect = require("../middlewares/auth.middleware");
const userController = require("../controllers/user.controller");
const {
  validateProfileUpdate,
  validatePasswordChange,
} = require("../middlewares/validation.middleware");

router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, validateProfileUpdate, userController.updateProfile);
router.put("/change-password", protect, validatePasswordChange, userController.changePassword);

module.exports = router;
