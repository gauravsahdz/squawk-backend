const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    require: [true, "A todo must have name."],
    minlength: [5, "A todo must have at least 5 characters."],
    maxlength: [15, "A todo must have less than 15 characters."],
    trim: true
  },
  description: {
    type: String,
    require: [true, "A todo must have description."],
    minlength: [10, "A todo must have at least 10 characters."],
    maxlength: [100, "A todo must have less than 100 characters."],
    trim: true,
  },
  userId: { type: String, require: [true, "A todo must have a user id."] },
  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active"
  }
});

todoSchema.set("timestamps", true);

//to capitalize the first letter of the title and lowercase the description while adding new todo
todoSchema.pre("save", function (next) {
  const words = this.title.split(" ");
  const desc = this.description.split(" ");
  this.title = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  this.description = desc
    .map((w) => w.charAt(0).toLowerCase() + w.slice(1).toLowerCase())
    .join(" ");

  next();
});

const Todo = mongoose.model("Todo", todoSchema);
module.exports = Todo;
