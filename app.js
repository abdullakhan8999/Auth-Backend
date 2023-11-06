const express = require("express");
const cors = require("cors");
// const bodyParser = require("body-parser");
const app = express();

// Config
if (process.env.NODE_ENV !== "production") {
   require("dotenv").config({ path: "Config/.env" })
}

//middleware
app.set("view engine", "ejs");
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// app.use(
//    cors({
//       origin: process.env.CLIENT_API,
//       methods: "GET,POST,PUT,DELETE",
//       credentials: true,
//    })
// );

app.use("*", cors({
   origin: true,
   credentials: true,
}))

//router 
app.get('/', (req, res) => {
   res.send("<h1>Welcome to user oauth</h1>")
})
app.use("/auth", require("./Routers/AuthRouter.js"));

module.exports = app;