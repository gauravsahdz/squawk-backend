const express = require("express");
const postController = require("../controller/postController");
const authController = require("../controller/authController");

const router = express.Router();

// Protect all routes in this router
router.use(authController.protect);

// Define routes for /api/v1/posts
router
  .route("/")
  .get(postController.getAllPosts)
  .post(postController.createPost);

router
  .route("/:id")
  .get(postController.getPost)
  .patch(postController.updatePost)
  .delete(postController.deletePost);

router.route("/like/:id").patch(postController.likePost);
router.route("/comment/:id").patch(postController.commentPost);
router.route("/retweet/:id").patch(postController.retweetPost);

router.route("/getPostByUserId/:id").get(postController.getPostsByUserId);

module.exports = router;
