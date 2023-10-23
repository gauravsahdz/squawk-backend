const express = require("express");
const authController = require("../controller/authController");
const notificationController = require("../controller/notificationController");

const router = express.Router();

// Protect all routes in this router
router.use(authController.protect);

// Define routes for /api/v1/notifications
router.route("/:id").get(notificationController.getAllNotifications);

module.exports = router;