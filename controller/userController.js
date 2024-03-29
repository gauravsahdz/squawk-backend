const multer = require("multer");

const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/users");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadedUserPhoto = upload.single("file");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  if (!users) {
    return res.status(404).json({ status: "fail", msg: "Not found" });
  }
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword"
      ),
      400
    );
  }

  const filterBody = filterObj(req.body, "username", "email");
  if (req.file) filterBody.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getUser = catchAsync(async (req, res) => {
  const currentUser = await User.findById(req.params.id);
  if (!currentUser) {
    return res.status(404).json({ status: "fail", msg: "Not found" });
  }
  res.status(200).json({
    status: "success",
    data: {
      user: currentUser,
    },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.followUser = async (req, res) => {
  const user = await User.findOne({ userId: req.params.id });
  if (!user) {
    return res.status(404).json({ status: "fail", msg: "User not found" });
  }
  if (user.followers.includes(req.user.userId)) {
    await User.findOneAndUpdate(
      { userId: req.params.id },
      { $pull: { followers: req.user.userId } },
      { new: true, runValidators: true }
    );
    await User.findOneAndUpdate(
      { userId: req.user.userId },
      { $pull: { followings: req.params.id } },
      { new: true, runValidators: true }
    );
    const updatedUser = await User.findOne({userId: req.params.id});
    const loggedInUser = await User.findById(req.user.id);
    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
        loggedInUser: loggedInUser,
      },
    });
  } else {
    await User.findOneAndUpdate(
      { userId: req.params.id },
      { $push: { followers: req.user.userId } },
      { new: true, runValidators: true }
    );
    await User.findOneAndUpdate(
      { userId: req.user.userId },
      { $push: { followings: req.params.id } },
      { new: true, runValidators: true }
    );
    const updatedUser = await User.findOne({userId: req.params.id});
    const loggedInUser = await User.findById(req.user.id);
    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
        loggedInUser: loggedInUser,
      },
    });
  }
};
