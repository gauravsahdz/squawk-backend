const Post = require("../models/postModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const catchAsync = require("../utils/catchAsync");

exports.getAllPosts = catchAsync(async (req, res) => {
  const posts = await Post.find().sort({ _id: -1 });
  for (let i = 0; i < posts.length; i++) {
    const user = await User.find({ userId: posts[i].userId });
    posts[i] = {
      ...posts[i]._doc,
      username: user[0].username,
      userDp: user[0].photo,
    };
  }
  res.status(200).json({
    status: "success",
    results: posts.length,
    data: {
      posts,
    },
  });
});

exports.createPost = catchAsync(async (req, res) => {
  const newPost = await Post.create({
    post: req.body.post,
    userId: req.user.userId,
  });
  res.status(201).json({
    status: "success",
    data: {
      post: newPost,
    },
  });
});

exports.getPost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id);
  res.status(200).json({
    status: "success",
    data: {
      post,
    },
  });
});

exports.getPostsByUserId = catchAsync(async (req, res) => {
  const posts = await Post.find({ userId: req.params.id }).sort({ _id: -1 });
  res.status(200).json({
    status: "success",
    results: posts.length,
    data: {
      posts,
    },
  });
});

exports.updatePost = catchAsync(async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  post.save();
  res.status(200).json({
    status: "success",
    data: {
      post,
    },
  });
});

exports.deletePost = catchAsync(async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.status(200).json({
    status: "success",
    data: null,
  });
});

exports.likePost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ status: "fail", msg: "Post Not found" });
  }

  if (post.likedBy.includes(req.user.userId)) {
    const updatedPost = await Post.findOneAndUpdate(
      { _id: req.params.id },
      { $pull: { likedBy: req.user.userId }, $inc: { likes: -1 } },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      status: "success",
      data: {
        post: updatedPost,
      },
    });
  } else {
    const updatedPost = await Post.findOneAndUpdate(
      { _id: req.params.id },
      { $push: { likedBy: req.user.userId }, $inc: { likes: 1 } },
      { new: true, runValidators: true }
    );

    const notification = await Notification.findOne({
      postOwner: post.userId,
      postId: req.params.id,
      notificationType: "like",
      senderId: req.user.username,
    });
    if (!notification) {
      await Notification.create({
        postOwner: post.userId,
        postId: req.params.id,
        notificationType: "like",
        senderId: req.user.username,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        post: updatedPost,
      },
    });
  }
});

exports.commentPost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ status: "fail", msg: "Post Not found" });
  }

  const updatedPost = await Post.findOneAndUpdate(
    { _id: req.params.id },
    {
      $push: {
        comments: {
          userId: req.user.userId,
          comment: req.body.comment,
        },
      },
    },
    { new: true, runValidators: true }
  );
  res.status(200).json({
    status: "success",
    data: {
      post: updatedPost,
    },
  });
});

exports.retweetPost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ status: "fail", msg: "Post Not found" });
  }

  if (post.retweetedBy.includes(req.user.userId)) {
    const updatedPost = await Post.findOneAndUpdate(
      { _id: req.params.id },
      { $pull: { retweetedBy: req.user.userId }, $inc: { retweets: -1 } },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      status: "success",
      data: {
        post: updatedPost,
      },
    });
  } else {
    const updatedPost = await Post.findOneAndUpdate(
      { _id: req.params.id },
      { $push: { retweetedBy: req.user.userId }, $inc: { retweets: 1 } },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      status: "success",
      data: {
        post: updatedPost,
      },
    });
  }
});
