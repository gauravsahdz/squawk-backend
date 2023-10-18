const express = require("express");
const router = express.Router();

const usersController = require("../controller/usersController");
const authController = require("../controller/authController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

router.get("/verification/:token", authController.verifyUser);
router.post("/forgotPassword", authController.forgotPassword);
router.get("/resetPasswordLink/:token", authController.validPasswordToken);
router.patch("/resetPassword/:token", authController.resetPassword);

//protect all routes after this middleware
router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);
router.get("/me", usersController.getMe, usersController.getUser);
router.patch(
  "/updateMe",
  usersController.uploadedUserPhoto,
  usersController.updateMe
);
router.delete("/deleteMe", usersController.deleteMe);

// only admin can access routes after this middleware
router.use(authController.restrictTo("admin"));

router.route("/").get(usersController.getAllUsers);

router
  .route("/:id")
  .get(usersController.getUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

module.exports = router;
