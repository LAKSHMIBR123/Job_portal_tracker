const express = require("express");
const router = express.Router();
const protect = require("../middlewares/auth.middleware");
const notificationController = require("../controllers/notification.controller");
const { validateObjectIdParam } = require("../middlewares/validation.middleware");

router.get("/", protect, notificationController.getNotifications);
router.patch("/:id/read", protect, validateObjectIdParam("id"), notificationController.markNotificationAsRead);

module.exports = router;
