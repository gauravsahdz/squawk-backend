const express = require("express");
const router = express.Router();

const userController = require("../controller/userController");
const authController = require("../controller/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

//protect all routes after this middleware
router.use(authController.protect);
router.get("/me", userController.getMe, userController.getUser);
router.patch(
  "/updateMe",
  userController.uploadedUserPhoto,
  userController.updateMe
);
router.delete("/deleteMe", userController.deleteMe);

router.route("/").get(userController.getAllUsers);

router.route("/:id").get(userController.getUser);

router.route("/follow/:id").patch(userController.followUser);

module.exports = router;
