const Notification = require("../models/notificationModel");
const Post = require("../models/postModel");

const catchAsync = require("../utils/catchAsync");

exports.getAllNotifications = catchAsync(async (req, res) => {
  //get all notifications based on req.params.id (userId) then for each notification get the respective post by postId and then merge it and sen dto client
  const notifications = await Notification.find({ userId: req.params.id });

  for (let i = 0; i < notifications.length; i++) {
    const post = await Post.findById(notifications[i].postId);
    notifications[i] = {
      ...notifications[i]._doc,
      post,
    };
  }

    res.status(200).json({
        status: "success",
        results: notifications.length,
        data: {
        notifications,
        },
    });
});
