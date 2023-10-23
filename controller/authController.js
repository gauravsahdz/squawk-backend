const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

const mongoose = require("mongoose");

// create jwt token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// sending token to the client
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);
  console.log("Token: ", token);
  console.log("Cookie: ", cookieOptions);

  // Remove password from output
  user.password = undefined;

  if (statusCode === 200 || statusCode === 201) {
    statusCode === 200
      ? console.log(`${user.email} logged in successfully`)
      : console.log(`${user.email} user created in successfully`);
    res.status(statusCode).json({
      status: "success",
      token,
      data: {
        user,
      },
    });
    console.log("User: ", user);
  }
};

// signup user
exports.signup = catchAsync(async (req, res, next) => {
  const existedUser = await User.findOne({ username: req.body.username });
  const existedEmail = await User.findOne({ email: req.body.email });
  if (existedUser || existedEmail) {
    return next(new AppError("Username or email already exists!", 409));
  }

  const userId = crypto.randomBytes(3).toString("hex");

  const newUser = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    userId: userId,
  });

  createSendToken(newUser, 201, res); // 201: created

  const newUserDetails = await User.findOne({ email: req.body.email });

  // send welcome email
  jwt.sign({ id: newUserDetails._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
});

// login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(req.body);
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  // 3) If everything ok, send token to client
  else {
    createSendToken(user, 200, res);
  }
});

// keep user logged in even after closing the browser
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// logout user
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
  console.log(`${req.user.email} logged out successfully`);
};

// restrict user from performing certain actions if not logged in
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});
