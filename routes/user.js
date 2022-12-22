const express = require("express");
const router = express.Router();
const User = require("../models/User");

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

//GET REQUESTS
router.get("/auth", async (req, res) => {
  try {
    //if there is no ongoing user session return 403
    if (!req.session.user) {
      return res.status(200).send({
        message: "User not authenticated",
        code: 1,
      });
    }

    //send user's data from user session
    res.status(200).send({
      message: "Authenticated user",
      result: req.session.user,
      code: 0,
    });
  } catch (err) {
    //in case of any error
    res.status(500).send({
      message: "Something went wrong",
      error: err.message,
      code: -1,
    });
    console.log(err);
  }
});

router.get("/info", async (req, res) => {
  try {
    //check if the given user does not exist in database
    if (
      !(await User.exists({
        $or: [{ username: req.body.username }, { email: req.body.email }],
      }))
    ) {
      //return a response and stop any further execution if given user is invalid
      return res.status(404).send({
        message: "Something went wrong",
        error: "The user is not registered on the database",
      });
    }

    //get User's info from mongoDB database
    const userInfo = (await User.findOne({ uid: req.params.uid })).toJSON();

    //send the response
    res.status(200).send(userInfo);
  } catch (err) {
    //in case of any error
    res.status(500).send({
      message: "Something went wrong",
      error: err.message,
      code: -1,
    });
    console.log(err);
  }
});

router.get("/new/validate", async (req, res) => {
  try {
    //check if the given email is already registered
    if (await User.exists({ username: req.body.username })) {
      //return a response and stop any further execution if given user is invalid
      return res.status(200).send({
        message: "Invalid",
        error: "The email is already registered on the database",
        code: 1,
      });
    }

    //check if the given username is already registered
    if (await User.exists({ username: req.body.username })) {
      //return a response and stop any further execution if given user is invalid
      return res.status(200).send({
        message: "Invalid",
        error: "The username is already registered on the database",
        code: 2,
      });
    }

    //Send validation response if everything is correct
    res.status(200).send({
      message: "Valid",
      code: 0,
    });
  } catch (err) {
    //in case of any error
    res.status(500).send({
      message: "Something went wrong",
      error: err.message,
      code: -1,
    });
    console.log(err);
  }
});

//POST REQUESTS
router.post("/new", async (req, res) => {
  try {
    //check if the given user is already registered
    if (
      await User.exists({
        $or: [{ username: req.body.username }, { email: req.body.email }],
      })
    ) {
      //return a response and stop any further execution if given user is invalid
      return res.status(400).send({
        message: "Something went wrong",
        error: "The user is already registered on the database",
        code: 1,
      });
    }

    //check if all input vales are provided and are valid
    if (!validateEmail(req.body.email)) {
      return res.status(400).send({
        message: "Something went wrong",
        error: "Email is invalid",
        code: 2,
      });
    }
    if (!(req.body.password.length > 6)) {
      return res.status(400).send({
        message: "Something went wrong",
        error: "Password is too short",
        code: 2,
      });
    }
    if (!(req.body.username.length > 3)) {
      return res.status(400).send({
        message: "Something went wrong",
        error: "Username is too short",
        code: 2,
      });
    }

    //create new user in mongoDB database
    const newUser = await User.create({
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    });

    //Store the user's data as cookie and mark as logged in
    req.session.user = newUser;

    //send response with new user as result
    res.status(200).send({
      message: "Success",
      result: newUser,
      code: 0,
    });
  } catch (err) {
    //in case of any error
    res.status(500).send({
      message: "Something went wrong",
      error: err.message,
      code: -1,
    });
    console.log(err);
  }
});

router.post("/login", async (req, res) => {
  try {
    //check if all input vales are provided and are valid
    userData = await User.findOne({
      username: req.body.username,
      password: req.body.password,
    });

    //if no user is found with given credentials return invalid credentials
    if (userData === null) {
      return res.status(401).send({
        message: "Invalid login credentials",
        code: 1,
      });
    }

    //Store the user's data as cookie and mark as logged in
    req.session.user = userData;

    //send response with logged in user as result
    res.status(200).send({
      message: "Success",
      result: userData,
      code: 0,
    });
  } catch (err) {
    //in case of any error
    res.status(500).send({
      message: "Something went wrong",
      error: err.message,
      code: -1,
    });
    console.log(err);
  }
});

//DELETE REQUESTS
router.delete("/logout", async (req, res) => {
  try {
    //destroy the current session to clear any cookies related to user session
    req.session.destroy();

    //Send validation response if everything is correct
    res.status(200).send({
      message: "Logged out",
      code: 0,
    });
  } catch (err) {
    //in case of any error
    res.status(500).send({
      message: "Something went wrong",
      error: err.message,
      code: -1,
    });
    console.log(err);
  }
});

module.exports = router;
