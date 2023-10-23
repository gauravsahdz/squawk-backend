const dotenv = require("dotenv");
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("UNHANDLER REJECTION! 🔥 shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

mongoose
  .connect(
    "mongodb+srv://gauravsahdz:2244@crud.jd7hb.mongodb.net/?retryWrites=true&w=majority",
    {
      dbName: "squawk",
      useNewUrlParser: true,
    }
  )
  .then(() => {
    console.log("Database connected sucessfully!");
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLER REJECTION! 🔥 shutting down...");
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
