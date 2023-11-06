const mongoose = require("mongoose");

const connectDB = () => {

   //connect to db
   mongoose
      .connect(process.env.MONGODB_URI || process.env.DB_URI, {
         autoIndex: true,
      })
      //log data after connected
      .then((data) => {
         console.log(
            `The MongoDB server is now connected, and the host information is: ${data.connection.host}.`
         );
      })
      //if there any error log message
      .catch((err) => {
         console.log("Error connecting to MongoDB:", err.message);
      });
};

module.exports = connectDB;