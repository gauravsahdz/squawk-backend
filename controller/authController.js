const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/usersModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("./../utils/email");

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
  console.log("Token: ",token);
  console.log("Cookie: ",cookieOptions);
  

  // Remove password from output
  user.password = undefined;

  if (statusCode === 200 || statusCode === 201) {
    //ternary if statement to console log if 200 or 201
    statusCode === 200 ? console.log(`${user.email} logged in successfully`) : console.log(`${user.email} user created in successfully`);
    res.status(statusCode).json({
      status: "success",
      token,
      data: {
        user,
      },
    });
    console.log("User: ",user);
  }
};


// signup user 
exports.signup = catchAsync(async (req, res, next) => {
  const existedUser = await User.findOne({ username: req.body.username });
  const existedEmail = await User.findOne({ email: req.body.email });
  if (existedUser || existedEmail) {
    return next(new AppError("Username or email already exists!", 409));
  }

  const uniqueID = crypto.randomBytes(3).toString("hex");

  const newUser = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    uniqueID: uniqueID,
  });

  createSendToken(newUser, 201, res); // 201: created


  const newUserDetails = await User.findOne({ email: req.body.email });

  // send welcome email
  jwt.sign(
    { id: newUserDetails._id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
    async (err, emailToken) => {
      const url = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/verification/${emailToken}`;
      await new Email(newUser, url).sendWelcome();
    }
  );
});

// verifying user based on token sent to email
exports.verifyUser = catchAsync(async (req, res, next) => {
  const token = req.params.token;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        res.status(400).json({ msg: "Incorrect or expired link." });
      } else {
        const { id } = decodedToken;
        const toBeVerifiedUser = await User.findById(id);
        toBeVerifiedUser.isVerified = true;
        await toBeVerifiedUser.save({ validateBeforeSave: false });
        res.redirect(process.env.REDIRECT_URL);
        console.log(`${toBeVerifiedUser.email} verified successfully`);
      }
    });
  } else {
    res.status(400).json({ msg: "Something went wrong." });
  }
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

  if (user.isVerified != true) {
    return res.status(403).send({
      message: "Pending Account. Please Verify Your Email!",
    });
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

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
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

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});


// restrict user from accessing certain routes if not admin
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};


// forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPasswordLink/${resetToken}`;

    // console.log({ resetURL });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });

    console.log(`Token sent to ${user.email} successfully`);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});


// verifying user based on token sent to email for password reset
exports.validPasswordToken = catchAsync(async (req, res, next) => {
  const token = req.params.token;
  // console.log({ token });
  if (!token) {
    return res.status(500).json({ message: "Token is required" });
  }
  //reverse the hashing process to get the original token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: resetPasswordToken,
  });

  if (!user) {
    return res.status(409).json({ message: "Invalid URL" });
  }
  console.log(`Token verified for forgotten password for ${user.email} successfully`);
  res.redirect(`${process.env.PASSWORD_RESET_REDIRECT_URL}/${token}`);
});

// reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  
  createSendToken(user, 200, res);
});

// update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");
  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
