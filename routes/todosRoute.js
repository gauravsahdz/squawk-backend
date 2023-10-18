const todosController = require("../controller/todosController");
const express = require("express");
const authController = require("../controller/authController");
const router = express.Router();

router
  .route("/")
  .get(authController.protect, todosController.getAllTodos);

router.route("/getTodosByUserId/:id").get(authController.protect, todosController.getTodosByUserId);
// router.route("/getTodosByUserId/:id/:status").get(authController.protect, todosController.statusTodos);
router.route("/getTodosByUserId/:id/:status").get(authController.protect, todosController.statusTodos);
router.route("/markAsCompleted/:id").patch(authController.protect, todosController.markAsCompleted);
router.route("/:id").post(
  authController.protect,
  todosController.createTodo
);

router
  .route("/:id")
  .get(authController.protect, todosController.getTodo)
  .patch(
    authController.protect,
    todosController.updateTodo
  )
  .delete(
    authController.protect,
    todosController.deleteTodo
  );

module.exports = router;
