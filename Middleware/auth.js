const jwt = require("jsonwebtoken");
const User = require("../Models/UserModel");


// take token from header and verify user and send user in req
exports.isAuthenticatedUser = async (req, res, next) => {
   const token = req.header('token');
   //if token not found
   if (!token) {
      return res.status(401)
         .json({
            error: "Please Login to access this resource"
         });
   }
   // get user id from token
   const { id } = jwt.verify(token, process.env.JWT_SECRET);
   req.user = await User.findById({ _id: id });
   // go to next middleware or controller
   next();
};
