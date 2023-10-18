const Todo = require("../models/todosModel");
const catchAsync = require("../utils/catchAsync");

exports.getAllTodos = catchAsync(async (req, res) => {
  const todos = await Todo.find().sort({ _id: -1 });
  if (!todos) {
    return res.status(404).json({ status: "fail", msg: "Not found" });
  }
  res.status(200).json({
    status: "success",
    results: todos.length,
    data: {
      todos,
    },
  });
});

exports.createTodo = catchAsync(async (req, res) => {
  const newTodo = await Todo.create(
    {
      title: req.body.title,
      description: req.body.description,
      userId: req.params.id
    }
  );
  res.status(201).json({
    status: "success",
    data: {
      todo: newTodo,
    },
  });
});

exports.getTodo = catchAsync(async (req, res) => {
  const todo = await Todo.findById(req.params.id);
  res.status(200).json({
    status: "success",
    data: {
      todo,
    },
  });
});

exports.getTodosByUserId = catchAsync(async (req, res) => {
  const todos = await Todo.find({ userId: req.params.id }).sort({ _id: -1 });
  res.status(200).json({
    status: "success",
    results: todos.length,
    data: {
      todos,
    },
  });
});

exports.statusTodos = catchAsync(async (req, res) => {
  // console.log(req.params);
  // console.log(req.params.id, req.params.status);
  const todos = await Todo.find({ userId: req.params.id, status: req.params.status }).sort({ _id: -1 });
  // console.log(todos);
  res.status(200).json({
    status: "success",
    results: todos.length,
    data: {
      todos,
    },
  });
});

exports.markAsCompleted = catchAsync(async (req, res) => {
  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id },
    { status: "completed" },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    data: {
      todo
    },
  });
});


exports.updateTodo = catchAsync(async (req, res) => {
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  const words = todo.title.split(" ");
  const desc = todo.description.split(" ");
  todo.title = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  todo.description = desc
    .map((w) => w.charAt(0).toLowerCase() + w.slice(1).toLowerCase())
    .join(" ");

  todo.save();
  res.status(200).json({
    status: "success",
    data: {
      todo
    },
  });
});

exports.deleteTodo = catchAsync(async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.status(200).json({
    status: "success",
    data: null,
  });
});
