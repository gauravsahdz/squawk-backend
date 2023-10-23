const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  postOwner: {
    type: String,
    ref: "User",
  },
  postId: {
    type: String,
    ref: "Post",
  },
  notificationType: {
    enum: ["like", "comment", "follow", "retweet"],
    type: String,
  },
  senderId: {
    type: String,
    ref: "User",
  },
});

notificationSchema.set("timestamps", true);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
