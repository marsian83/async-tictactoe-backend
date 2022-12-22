require("dotenv").config();

const fs = require("fs");
const path = require("path");

const express = require("express");
const app = express();

var session = require("express-session");
app.set("trust proxy", 1); // trust first proxy

//Import mongoose and set strictQuery to true (depracated warning)
const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

//Constants
PORT = process.env.PORT || 8073;

//Middleware
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 90000 },
  })
);

//Dynamically import and use all routes
const routesPath = path.join(__dirname, "routes");
const dirents = fs.readdirSync(routesPath, { withFileTypes: true });
const filesNames = dirents
  .filter((dirent) => dirent.isFile())
  .map((dirent) => dirent.name);

filesNames.forEach((filename) => {
  var route = path.join(routesPath, filename);
  var router = require(route);
  app.use(`/api/${path.parse(route).name}`, router);
});

//Connect to MongoDB and Start the server
mongoose.connect(
  process.env.MONGODB_CONNECTION_URI,
  () => {
    console.log("Connected to mongoDB database");

    //Start the server after mongoose client is connected for serverless
    app.listen(PORT, () => {
      console.log(`Server up and listening on port ${PORT}`);
    });
  },
  (err) => {
    "Could not connect to mongoDB database";
    console.log(err);
  }
);
