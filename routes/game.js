const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Game = require("../models/Game");

//Middleware to make sure only authenticated users can make requests to the /game/ endpoints
const authenticateRequests = (req, res, next) => {
  // move over to the next middleware if user if successfully logged in
  if (req.session.user) {
    next();
  } else {
    res.status(401).send({ message: "User not authenticated" });
  }
};

router.use(authenticateRequests);

//GET REQUESTS
router.get("/info/:id", async (req, res) => {
  try {
    //find entries of the specified game id in the database
    const gameInfo = await Game.findOne({ _id: req.params.id });

    //return not found if the game is not found
    if (!gameInfo) {
      return res.status(404).send({
        message: "Game does not exist",
        code: 1,
      });
    }

    //return a response if the game is found successfully
    res.status(200).send({
      message: "Success",
      result: gameInfo,
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

router.get("/user/:username", async (req, res) => {
  try {
    // Find games where this user is involved in the database ordering it by date (most recent first)
    const games = await Game.find({
      $or: [{ player1: req.params.username }, { player2: req.params.username }],
    }).sort({ updatedAt: -1 });

    //send the found games
    res.status(200).send({
      result: games,
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
    //Verify the given email is valid
    if (
      req.body.player1 === req.body.player2 ||
      !(
        (await User.exists({ email: req.body.player1 })) &&
        (await User.exists({ email: req.body.player2 }))
      )
    ) {
      //if either of the email is invalid on the database return an error for the same
      return res.status(400).send({
        message: "Invalid users",
        code: 1,
      });
    }

    //get Usernames of both the players
    player1 = await User.findOne({ email: req.body.player1 });
    player2 = await User.findOne({ email: req.body.player2 });

    //check if a game already exists within these two players
    const ongoing = await Game.findOne({
      $or: [
        { player1: player1.username, player2: player2.username },
        { player1: player2.username, player2: player1.username },
      ],
    });
    //if a game already exists, return it instead
    if (ongoing) {
      return res.status(200).send({
        message: "Game between these players already exists",
        result: ongoing,
        code: 0,
      });
    }

    //Create a new game if none of the above checks return a response
    newGame = await Game.create({
      player1: player1.username,
      player2: player2.username,
    });

    //send response with new game as result
    res.status(200).send({
      message: "Success",
      result: newGame,
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

//PUT REQUESTS
router.put("/play/:id/:piece", async (req, res) => {
  try {
    //find entries of the specified game id in the database
    const gameInfo = await Game.findOne({ _id: req.params.id });

    //return not found if the game is not found
    if (!gameInfo) {
      return res.status(404).send({
        message: "Game does not exist",
        code: 1,
      });
    }

    //get and update state
    let board = gameInfo.board;
    board[req.body.box] = req.params.piece;

    //Update the gameinfo to include the latest move
    await Game.updateOne({ id: req.params.id }, { $set: { board: board } });

    //Check if the game has been won by any player
    let gameWon = false;
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const combination of winningCombinations) {
      if (
        board[combination[0]] === board[combination[1]] &&
        board[combination[1]] === board[combination[2]]
      ) {
        gameWon = true;
        break;
      }
    }

    if (gameWon) {
      //Update the game state to reflect that the game has been won by the current player
      let state = `win/${req.params.piece === "x" ? "p1" : "p2"}`;
      await Game.updateOne({ id: req.params.id }, { $set: { state: state } });
    } else {
      await Game.updateOne(
        { id: req.params.id },
        { $set: { state: "wait/" + req.params.piece === "x" ? "p2" : "p1" } }
      );
    }
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
