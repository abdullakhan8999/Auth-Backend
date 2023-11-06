const User = require("../Models/UserModel");
const errorHandler = require("../Utils/errorHandler");
const sendEmail = require("../Utils/sendEmail");
const sendToken = require("../Utils/sendTokem");
const cloudinary = require("cloudinary");
const crypto = require("crypto");

//register User
exports.registerUser = async (req, res, next) => {
   try {
      let myCloud = {};
      const { name, email, password } = req.body;
      //find user is already exits
      let user = await User.findOne({ email: email });
      if (user) return next(errorHandler(res, 400, "User already exits!"));

      // no image is uploaded so we use default img
      if (req.body.avatar != "/Profile.png") {
         myCloud
            = await cloudinary.v2.uploader.upload(req.body.avatar, {
               folder: "avatars",
               width: 150,
               crop: "scale",
            });
      } else {
         let number = Math.floor(Math.random() * (9999 - 1000) + 1000);
         myCloud.public_id = "avatars/Profile_se7ybf" + number;
         myCloud.secure_url = "https://res.cloudinary.com/dwpi8ryr2/image/upload/v1699122477/avatars/Profile_se7ybf.png"
      }

      //create user
      user = await User.create({
         name,
         email,
         password,
         avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
         },
      });

      //send user wiht token
      sendToken(user, 200, res)
   } catch (error) {
      if (error.status === 400 && error.message.includes("File size too large")) {
         return res.status(413).json({ error: 'Request entity too large' });
      }
      next(error)
   }

};

//google User register 
exports.googleRegisterUser = async (req, res, next) => {
   const { name, email, imgUrl } = req.body;

   // check for user exist then send user
   let user = await User.findOne({ email: email });
   if (user) return sendToken(user, 200, res)

   // user not exist then create new user
   user = await User.create({
      name,
      email,
      avatar: {
         public_id: imgUrl,
         url: imgUrl,
      },
      OauthUser: true

   });

   //send user and token
   sendToken(user, 200, res)
};

//Get user detailed
exports.getUserDetails = async (req, res, next) => {
   //when user login user id 
   const UserId = req.user.id;
   const user = await User.findById(UserId);

   //if user not exits send error
   if (!user) return next(errorHandler(res, 400, "User doesn't exits!"));

   //send user
   res.status(200).json({
      status: "success",
      user,
   });
}

//Login user
exports.loginUser = async (req, res, next) => {
   const { email, password } = req.body;

   //Find user 
   const user = await User.findOne({ email });
   if (!user) {
      return errorHandler(res, 404, `Invalid email or password.`)
   }

   //Check and compare password
   const isPasswordMatch = await user.comparePassword(password);
   if (!isPasswordMatch) {
      return errorHandler(res, 401, `Invalid email or password.`)
   }

   //If User there then send status and token
   sendToken(user, 200, res);
};

// forgot Password
exports.forgotPassword = async (req, res, next) => {
   const { email } = req.body;

   //check user is exits or not
   const user = await User.findOne({ email });
   if (!user) {
      return errorHandler(res, 404, `User doesn't exits!`)
   }

   // get new reset password token
   const resetToken = await user.getResetPasswordToken();
   await user.save({ validateBeforeSave: false });

   //Reset password url
   const resetUrl = `${req.protocol}://${req.get("host")}/auth/password/reset/${resetToken}`;

   //Message to send user for reset password
   const message = `<!DOCTYPE html>
<html>

<head>
   <meta charset="utf-8" />
   <title>Password Reset Request</title>

</head>

<body class="body">
   <div class="container">
      <h2>Hi ${user.name},</h2>
      <p>
         We received a request to reset the password for your account. If you did not make this request, please ignore
         this message.
      </p>
      <p>
         To reset your password, click the Link:
         <a href=${resetUrl}>Reset Password</a>
      </p>
      <p>
         This link is valid for the next 30 minutes. If you do not reset your
         password within this time, you will need to submit another reset
         password request.
      </p>
      <p>Thanks.</p>
   </div>
</body>

</html>`;

   try {

      // send email to user 
      await sendEmail({
         email: user.email,
         subject: "User auth Password Recovery",
         message,
      });

      // send response to user
      res.status(200).json({
         status: "success",
         message: `Email sent successfully to: ${user.email}`,
         resetUrl,
      });
   } catch (error) {
      user.resetPasswordToken = "";
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(errorHandler(res, 500, error.message));
   }
}

// reset Password 
exports.resetPassword = async (req, res, next) => {
   //  reset token  form params
   const resetToken = req.params.token;

   // Render an HTML form and set reset toke in params 
   res.render("reset-password-form", { resetToken });
};

// update reset Password 
exports.resetPasswordUpdate = async (req, res, next) => {
   const { password } = req.body;
   const resetToken = req.params.token;

   // Find  user by reset token and check isExpired
   const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

   //find user 
   const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
   });

   // if user not exits send error
   if (!user) {
      return next(errorHandler(res, 400, "Invalid or expired token."));
   }

   // Update user password 
   user.password = password;
   // remove reset password token and expiration
   user.resetPasswordToken = "";
   user.resetPasswordExpire = undefined;

   // Save
   await user.save();

   // Redirect to  home page 
   res.redirect(process.env.CLIENT_API);
}
