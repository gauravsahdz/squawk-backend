const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  //schema for a twitter like post
  userId: {
    type: String,
    ref: "User",
  },
  post: {
    type: String,
    required: [true, "Post cannot be empty"],
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      userId: {
        type: String,
        ref: "User",
      },
      comment: {
        type: String,
        required: [true, "Comment cannot be empty"],
      },
      commentedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  retweets: {
    type: Number,
    default: 0,
  },
  likedBy: {
    type: Array,
    default: [],
  },
  retweetedBy: {
    type: Array,
    default: [],
  },
});

postSchema.set("timestamps", true);

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
