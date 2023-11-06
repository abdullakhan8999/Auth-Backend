const express = require("express");
const { registerUser, getUserDetails, loginUser, forgotPassword, resetPassword, resetPasswordUpdate, googleRegisterUser } = require("../Controllers/AuthController.js");
const { isAuthenticatedUser } = require("../Middleware/auth.js");
const router = express.Router();

//register user Router
router.post("/register", registerUser);

//register google user Router
router.post("/google/register", googleRegisterUser);

//Get User details Router if user is isAuthenticatedUser
router.get("/me", isAuthenticatedUser, getUserDetails);

//Login User Router
router.post("/login", loginUser);

//Forget Password Router
router.post("/password/forgot", forgotPassword);

//Reset Password Router : get 
router.get("/password/reset/:token", resetPassword);

// Reset Password Router : post
router.post("/password/reset/:token", resetPasswordUpdate);

module.exports = router;